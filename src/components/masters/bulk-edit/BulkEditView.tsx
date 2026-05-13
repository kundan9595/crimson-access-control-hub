import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import DataGrid, { type Column, type RenderCellProps, type RenderEditCellProps } from 'react-data-grid';
import { Plus, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { useQueryClient, type UseMutateAsyncFunction } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useBulkEditGrid } from './useBulkEditGrid';
import { batchSave } from './batchSave';
import { getCellRenderer, getCellEditor } from './cellTypes';
import type { BulkEditColumn, GridRowState } from './types';
import 'react-data-grid/lib/styles.css';
import './grid.css';

export interface BulkEditViewProps<TRow, TCreate, TUpdate> {
  title: string;
  columns: BulkEditColumn<TRow>[];
  data: TRow[];
  isLoading: boolean;
  getRowId: (row: TRow) => string;
  createEmptyRow: () => TRow;
  toCreatePayload: (row: TRow) => TCreate;
  toUpdatePayload: (row: TRow) => TUpdate;
  queryKey: string[];
  createMutation: UseMutateAsyncFunction<unknown, Error, TCreate, unknown>;
  updateMutation: UseMutateAsyncFunction<unknown, Error, { id: string; updates: TUpdate }, unknown>;
  deleteMutation: UseMutateAsyncFunction<unknown, Error, string, unknown>;
  /** Called after a successful save with no failures, or after the user discards. */
  onClose: () => void;
}

function BulkEditView<TRow, TCreate, TUpdate>({
  title,
  columns,
  data,
  isLoading,
  getRowId,
  createEmptyRow,
  toCreatePayload,
  toUpdatePayload,
  queryKey,
  createMutation,
  updateMutation,
  deleteMutation,
  onClose,
}: BulkEditViewProps<TRow, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ completed: 0, total: 0 });

  const {
    rows,
    selectedRows,
    setSelectedRows,
    addNewRow,
    deleteSelectedRows,
    markRowDirty,
    hasChanges,
    dirtyCount,
    newCount,
    deletedCount,
    invalidCount,
    resetToInitial,
    handlePaste,
    getChanges,
    applyServerErrors,
  } = useBulkEditGrid<TRow>({
    initialData: data,
    getRowId,
    createEmptyRow,
    columns,
  });

  useEffect(() => {
    if (!isLoading && data.length > 0) {
      resetToInitial();
    }
  }, [isLoading, data, resetToInitial]);

  const gridColumns = useMemo<Column<GridRowState<TRow>>[]>(() => {
    return columns.map((col) => ({
      key: col.key,
      name: col.name,
      width: col.width || 150,
      frozen: col.key === 'name',
      renderCell: (props: RenderCellProps<GridRowState<TRow>>) => {
        const { row, onRowChange: gridOnRowChange } = props;
        const hasError = row.validationErrors[col.key as string];
        const isDeleted = row.isDeleted;

        // For image types, we need to handle onRowChange from the popover
        const isImageType = col.type === 'image' || col.type === 'images';
        const handleImageChange = isImageType
          ? (newRowData: TRow) => {
              const rowId = getRowId(row.current);
              gridOnRowChange({ ...row, current: newRowData });
              markRowDirty(rowId, newRowData);
            }
          : undefined;

        const cellContent = col.renderCell
          ? col.renderCell({
              ...props,
              row: row.current,
              onRowChange: handleImageChange,
            } as unknown as RenderCellProps<TRow>)
          : getCellRenderer<TRow>(col.type)({
              ...props,
              column: col as unknown as RenderCellProps<TRow>['column'],
              row: row.current,
              onRowChange: handleImageChange,
            } as unknown as RenderCellProps<TRow>);

        return (
          <div
            className={`
              h-full flex items-center
              ${hasError ? 'text-destructive' : ''}
              ${isDeleted ? 'opacity-50 line-through' : ''}
            `}
            title={hasError || undefined}
          >
            {cellContent}
          </div>
        );
      },
      renderEditCell: col.readonly
        ? undefined
        : (props: RenderEditCellProps<GridRowState<TRow>>) => {
            const { row, onRowChange, onClose: onEditClose } = props;
            const Editor = col.renderEditCell
              ? col.renderEditCell
              : getCellEditor<TRow>(col.type);

            // Image types use popover in renderCell, not inline editing
            if (col.type === 'image' || col.type === 'images') {
              return null;
            }

            if (!Editor) return null;

            const handleChange = (newRowData: TRow) => {
              const rowId = getRowId(row.current);
              onRowChange({ ...row, current: newRowData });
              markRowDirty(rowId, newRowData);
            };

            return Editor({
              column: col as unknown as BulkEditColumn<TRow>,
              row: row.current,
              onRowChange: handleChange,
              onClose: onEditClose,
            } as unknown as RenderEditCellProps<TRow> & { column: BulkEditColumn<TRow> });
          },
    }));
  }, [columns, getRowId, markRowDirty]);

  const handleSelectedRowsChange = useCallback(
    (newSelected: Set<React.Key>) => {
      setSelectedRows(newSelected as Set<string>);
    },
    [setSelectedRows],
  );

  const handleGridPaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const cell = target.closest('[role="gridcell"]') as HTMLElement | null;
      if (!cell) return;

      const rowId = cell.getAttribute('data-row-id');
      const columnKey = cell.getAttribute('data-column-key');
      if (!rowId || !columnKey) return;

      event.preventDefault();
      const clipboardData = event.clipboardData.getData('text');
      const splitRows = clipboardData.split(/\r?\n/).filter((r) => r.trim());
      const pastedData = splitRows.map((row) => row.split('\t'));

      handlePaste(rowId, columnKey, pastedData);
    },
    [handlePaste],
  );

  const handleSave = useCallback(async () => {
    if (invalidCount > 0) {
      toast.error(`Fix ${invalidCount} invalid cell${invalidCount === 1 ? '' : 's'} before saving.`);
      return;
    }

    const { toCreate, toUpdate, toDelete } = getChanges();
    if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setSaveProgress({ completed: 0, total: toCreate.length + toUpdate.length + toDelete.length });

    const result = await batchSave({
      toCreate: toCreate.map(toCreatePayload),
      toUpdate: toUpdate.map(({ id, row }) => ({ id, row: toUpdatePayload(row) })),
      toDelete,
      createMutation,
      updateMutation,
      deleteMutation,
      entityName: title,
      onProgress: (completed, total) => {
        setSaveProgress({ completed, total });
      },
    });

    if (result.errors.length > 0) {
      applyServerErrors(result.errors);
    }

    await queryClient.invalidateQueries({ queryKey });

    setIsSaving(false);

    const successCount = result.created + result.updated + result.deleted;
    if (result.failed === 0) {
      toast.success(`Saved ${successCount} change${successCount === 1 ? '' : 's'}.`);
      onClose();
    } else {
      toast.error(`${result.failed} change${result.failed === 1 ? '' : 's'} failed. See highlighted rows.`);
    }
  }, [
    invalidCount,
    getChanges,
    toCreatePayload,
    toUpdatePayload,
    createMutation,
    updateMutation,
    deleteMutation,
    title,
    applyServerErrors,
    queryClient,
    queryKey,
    onClose,
  ]);

  const handleDiscard = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('Discard all changes?');
      if (!confirmed) return;
    }
    resetToInitial();
    onClose();
  }, [hasChanges, resetToInitial, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving && invalidCount === 0) {
          handleSave();
        }
      }
      if (e.key === 'Escape' && !isSaving) {
        handleDiscard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, invalidCount, handleSave, handleDiscard]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const getRowClass = useCallback((row: GridRowState<TRow>) => {
    const classes: string[] = [];
    if (row.isDeleted) classes.push('rdg-row-deleted');
    if (row.isNew && !row.isDeleted) classes.push('rdg-row-new');
    if (Object.keys(row.validationErrors).length > 0) classes.push('rdg-row-invalid');
    return classes.join(' ');
  }, []);

  const rowKeyGetter = useCallback(
    (row: GridRowState<TRow>) => getRowId(row.current),
    [getRowId],
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 py-3 border-b bg-muted/50 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addNewRow} disabled={isSaving}>
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelectedRows}
              disabled={selectedRows.size === 0 || isSaving}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <span className="text-sm text-muted-foreground">
              {selectedRows.size > 0 ? `${selectedRows.size} selected` : 'Click cells to edit'}
            </span>
            {invalidCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 ml-2">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} invalid
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="outline" className="flex items-center gap-1 ml-1">
                {dirtyCount > 0 && <span>{dirtyCount} modified</span>}
                {newCount > 0 && <span>{newCount} new</span>}
                {deletedCount > 0 && <span>{deletedCount} deleted</span>}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={isSaving}>
              <X className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || invalidCount > 0 || !hasChanges}
              size="sm"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {saveProgress.completed}/{saveProgress.total}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0" onPaste={handleGridPaste}>
        <DataGrid<GridRowState<TRow>>
          columns={gridColumns}
          rows={rows}
          rowKeyGetter={rowKeyGetter}
          rowClass={getRowClass}
          selectedRows={selectedRows}
          onSelectedRowsChange={handleSelectedRowsChange}
          rowSelection={'multiple'}
          enableVirtualization
          className="h-full rdg"
        />
      </div>

      <div className="px-6 py-3 border-t bg-muted/50 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{rows.filter((r) => !r.isDeleted).length} rows</span>
            <span className="text-xs hidden md:inline">Double-click or press Enter to edit</span>
            <span className="text-xs hidden lg:inline">Paste from Excel/Sheets supported</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+S</kbd>
            <span className="text-xs">to save</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Esc</kbd>
            <span className="text-xs">to discard</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkEditView;

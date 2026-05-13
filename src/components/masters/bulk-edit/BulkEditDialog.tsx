import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import DataGrid, { type Column, type RenderCellProps, type RenderEditCellProps } from 'react-data-grid';
import { Plus, Trash2, X, Save, AlertCircle, Pencil } from 'lucide-react';
import { useQueryClient, type UseMutateAsyncFunction } from '@tanstack/react-query';
import { useBulkEditGrid } from './useBulkEditGrid';
import { batchSave } from './batchSave';
import { getCellRenderer, getCellEditor, validateCellValue } from './cellTypes';
import type { BulkEditColumn, GridRowState } from './types';
import 'react-data-grid/lib/styles.css';
import './grid.css';

export interface BulkEditDialogProps<TRow, TCreate, TUpdate> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

function BulkEditDialog<TRow, TCreate, TUpdate>({
  open,
  onOpenChange,
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
}: BulkEditDialogProps<TRow, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ completed: 0, total: 0 });

  const {
    rows,
    setRows,
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

  // Reset when dialog opens with new data
  useEffect(() => {
    if (open && data.length > 0) {
      resetToInitial();
    }
  }, [open, data, resetToInitial]);

  // Convert our columns to react-data-grid columns
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
        const isNew = row.isNew;

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
            const { row, onRowChange, onClose } = props;
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
              onClose,
            } as unknown as RenderEditCellProps<TRow> & { column: BulkEditColumn<TRow> });
          },
    }));
  }, [columns, getRowId, markRowDirty]);

  // Handle row selection change
  const handleSelectedRowsChange = useCallback(
    (newSelected: Set<React.Key>) => {
      setSelectedRows(newSelected as Set<string>);
    },
    [setSelectedRows]
  );

  // Handle paste from clipboard
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
      const rows = clipboardData.split(/\r?\n/).filter((r) => r.trim());
      const pastedData = rows.map((row) => row.split('\t'));

      handlePaste(rowId, columnKey, pastedData);
    },
    [handlePaste]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (invalidCount > 0) return;

    const { toCreate, toUpdate, toDelete } = getChanges();
    if (toCreate.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
      onOpenChange(false);
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

    // Apply any server errors to the grid
    if (result.errors.length > 0) {
      applyServerErrors(result.errors);
    }

    // Invalidate queries regardless of success/failure
    await queryClient.invalidateQueries({ queryKey });

    setIsSaving(false);

    // Close dialog if all succeeded
    if (result.failed === 0) {
      onOpenChange(false);
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
    onOpenChange,
  ]);

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('Discard all changes?');
      if (!confirmed) return;
    }
    resetToInitial();
    onOpenChange(false);
  }, [hasChanges, resetToInitial, onOpenChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaving && invalidCount === 0) {
          handleSave();
        }
      }
      // Escape to close (with confirm if changes exist)
      if (e.key === 'Escape' && !isSaving) {
        handleDiscard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSaving, invalidCount, handleSave, handleDiscard]);

  // Row class based on state
  const getRowClass = useCallback(
    (row: GridRowState<TRow>) => {
      const classes: string[] = [];
      if (row.isDeleted) classes.push('rdg-row-deleted');
      if (row.isNew && !row.isDeleted) classes.push('rdg-row-new');
      if (Object.keys(row.validationErrors).length > 0) classes.push('rdg-row-invalid');
      return classes.join(' ');
    },
    []
  );

  // Row key getter
  const rowKeyGetter = useCallback((row: GridRowState<TRow>) => {
    return getRowId(row.current);
  }, [getRowId]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Bulk Edit: {title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDiscard}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 flex flex-col"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if there are changes
          if (hasChanges) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Pencil className="h-5 w-5" />
              Bulk Edit: {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {invalidCount > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {invalidCount} invalid
                </Badge>
              )}
              {hasChanges && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {dirtyCount > 0 && <span>{dirtyCount} modified</span>}
                  {newCount > 0 && <span>{newCount} new</span>}
                  {deletedCount > 0 && <span>{deletedCount} deleted</span>}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-muted/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addNewRow}
                disabled={isSaving}
              >
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
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={isSaving}
              >
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

        {/* Grid */}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/50 shrink-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{rows.filter((r) => !r.isDeleted).length} rows</span>
              <span className="text-xs">Double-click or press Enter to edit</span>
              <span className="text-xs">Paste from Excel/Sheets supported</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd+S</kbd>
              <span className="text-xs">to save</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Esc</kbd>
              <span className="text-xs">to discard</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BulkEditDialog;

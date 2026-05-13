import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { GridRowState, BatchSaveResult, BulkEditColumn, ImageValue, ImagesValue } from './types';
import { validateCellValue } from './cellTypes';

interface UseBulkEditGridOptions<TRow> {
  initialData: TRow[];
  getRowId: (row: TRow) => string;
  createEmptyRow: () => TRow;
  columns: BulkEditColumn<TRow>[];
}

interface UseBulkEditGridResult<TRow> {
  rows: GridRowState<TRow>[];
  setRows: React.Dispatch<React.SetStateAction<GridRowState<TRow>[]>>;
  selectedRows: Set<string>;
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  addNewRow: () => void;
  selectAllRows: () => void;
  deleteSelectedRows: () => void;
  markRowDirty: (rowId: string, newRow: TRow) => void;
  validateRow: (row: GridRowState<TRow>) => Record<string, string>;
  hasChanges: boolean;
  dirtyCount: number;
  newCount: number;
  deletedCount: number;
  invalidCount: number;
  resetToInitial: () => void;
  handlePaste: (targetRowId: string, targetColumnKey: string, pastedData: string[][]) => void;
  getChanges: () => {
    toCreate: TRow[];
    toUpdate: Array<{ id: string; row: TRow }>;
    toDelete: string[];
  };
  applyServerErrors: (errors: Array<{ rowId: string; error: string }>) => void;
}

// Helper to compare two values, handling File objects in image types
function isDeepEqual(a: unknown, b: unknown, columnType?: string): boolean {
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;

  // Handle File objects (can't use JSON.stringify)
  if (a instanceof File || b instanceof File) {
    if (!(a instanceof File) || !(b instanceof File)) return false;
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
  }

  // Handle ImageValue
  if (columnType === 'image' || isImageValue(a) || isImageValue(b)) {
    const av = a as ImageValue | undefined;
    const bv = b as ImageValue | undefined;
    // Compare existing URLs
    if (av?.existingUrl !== bv?.existingUrl) return false;
    // Compare files by metadata
    if (av?.file && bv?.file) {
      if (
        av.file.name !== bv.file.name ||
        av.file.size !== bv.file.size ||
        av.file.lastModified !== bv.file.lastModified
      ) {
        return false;
      }
    } else if (av?.file !== bv?.file) {
      return false;
    }
    return true;
  }

  // Handle ImagesValue
  if (columnType === 'images' || isImagesValue(a) || isImagesValue(b)) {
    const av = a as ImagesValue | undefined;
    const bv = b as ImagesValue | undefined;
    const aExisting = av?.existingUrls ?? [];
    const bExisting = bv?.existingUrls ?? [];
    if (aExisting.length !== bExisting.length) return false;
    for (let i = 0; i < aExisting.length; i++) {
      if (aExisting[i] !== bExisting[i]) return false;
    }
    const aFiles = av?.files ?? [];
    const bFiles = bv?.files ?? [];
    if (aFiles.length !== bFiles.length) return false;
    for (let i = 0; i < aFiles.length; i++) {
      if (
        aFiles[i].name !== bFiles[i].name ||
        aFiles[i].size !== bFiles[i].size ||
        aFiles[i].lastModified !== bFiles[i].lastModified
      ) {
        return false;
      }
    }
    return true;
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isDeepEqual(item, b[i]));
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      isDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

function isImageValue(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return 'existingUrl' in o || 'file' in o;
}

function isImagesValue(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return 'existingUrls' in o || 'files' in o;
}

export function useBulkEditGrid<TRow>({
  initialData,
  getRowId,
  createEmptyRow,
  columns,
}: UseBulkEditGridOptions<TRow>): UseBulkEditGridResult<TRow> {
  const initialDataRef = useRef(initialData);

  // Initialize rows from initial data
  const initializeRows = useCallback((data: TRow[]): GridRowState<TRow>[] => {
    return data.map((row) => ({
      original: row,
      current: row,
      isNew: false,
      isDeleted: false,
      isDirty: false,
      validationErrors: {},
    }));
  }, []);

  const [rows, setRows] = useState<GridRowState<TRow>[]>(() => initializeRows(initialData));
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Validate a single row
  const validateRow = useCallback((rowState: GridRowState<TRow>): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const col of columns) {
      if (col.readonly) continue;
      const value = String(rowState.current[col.key as keyof TRow] ?? '');
      const validation = validateCellValue(col.type, value, col as BulkEditColumn<unknown>);
      if (!validation.valid) {
        errors[col.key as string] = validation.error || 'Invalid value';
      }
    }
    return errors;
  }, [columns]);

  // Add a new row
  const addNewRow = useCallback(() => {
    const newRow = createEmptyRow();
    const tempId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRowState: GridRowState<TRow> = {
      original: newRow,
      current: newRow,
      isNew: true,
      isDeleted: false,
      isDirty: true,
      validationErrors: validateRow({
        original: newRow,
        current: newRow,
        isNew: true,
        isDeleted: false,
        isDirty: true,
        validationErrors: {},
      }),
    };
    setRows((prev) => [...prev, newRowState]);
    setSelectedRows(new Set([tempId]));
  }, [createEmptyRow, validateRow]);

  const selectAllRows = useCallback(() => {
    setSelectedRows(
      new Set(rows.filter((r) => !r.isDeleted).map((r) => String(getRowId(r.current)))),
    );
  }, [rows, getRowId]);

  // Delete selected rows
  const deleteSelectedRows = useCallback(() => {
    setRows((prev) =>
      prev.map((row) => {
        const rowId = getRowId(row.current);
        if (selectedRows.has(rowId)) {
          // If it's a new row, we can remove it entirely
          if (row.isNew) {
            return { ...row, isDeleted: true };
          }
          // Otherwise mark as deleted
          return { ...row, isDeleted: true };
        }
        return row;
      })
    );
    setSelectedRows(new Set());
  }, [selectedRows, getRowId]);

  // Mark a row as dirty when edited
  const markRowDirty = useCallback(
    (rowId: string, newRow: TRow) => {
      setRows((prev) =>
        prev.map((row) => {
          const currentId = getRowId(row.current);
          if (currentId !== rowId) return row;

          // Use deep comparison that handles File objects
          let isDirty = false;
          const colMap = new Map(columns.map((c) => [c.key, c]));

          for (const key of Object.keys(row.original)) {
            const column = colMap.get(key as keyof TRow & string);
            const originalVal = (row.original as Record<string, unknown>)[key];
            const newVal = (newRow as Record<string, unknown>)[key];
            if (!isDeepEqual(originalVal, newVal, column?.type)) {
              isDirty = true;
              break;
            }
          }
          // Also check if any new keys were added
          if (!isDirty) {
            for (const key of Object.keys(newRow)) {
              if (!(key in row.original)) {
                isDirty = true;
                break;
              }
            }
          }

          const validationErrors = validateRow({
            ...row,
            current: newRow,
            isDirty,
          });

          return {
            ...row,
            current: newRow,
            isDirty,
            validationErrors,
          };
        })
      );
    },
    [getRowId, validateRow, columns]
  );

  // Handle paste from clipboard
  const handlePaste = useCallback(
    (targetRowId: string, targetColumnKey: string, pastedData: string[][]) => {
      if (!pastedData.length || !pastedData[0].length) return;

      setRows((prevRows) => {
        const newRows = [...prevRows];
        const targetIndex = newRows.findIndex((r) => getRowId(r.current) === targetRowId);
        if (targetIndex === -1) return prevRows;

        const columnIndex = columns.findIndex((c) => c.key === targetColumnKey);
        if (columnIndex === -1) return prevRows;

        const editableColumns = columns.filter((c) => !c.readonly);

        pastedData.forEach((rowData, rowOffset) => {
          const currentRowIndex = targetIndex + rowOffset;

          // If we're pasting beyond existing rows, add new rows
          if (currentRowIndex >= newRows.length) {
            for (let i = newRows.length; i <= currentRowIndex; i++) {
              const emptyRow = createEmptyRow();
              newRows.push({
                original: emptyRow,
                current: emptyRow,
                isNew: true,
                isDeleted: false,
                isDirty: true,
                validationErrors: {},
              });
            }
          }

          const rowState = newRows[currentRowIndex];
          if (rowState.isDeleted) return;

          let updatedRow = { ...rowState.current };

          rowData.forEach((cellValue, colOffset) => {
            const targetColIndex = columnIndex + colOffset;
            if (targetColIndex >= columns.length) return;

            const column = columns[targetColIndex];
            if (column.readonly) return;

            const validation = validateCellValue(
              column.type,
              cellValue,
              column as BulkEditColumn<unknown>
            );

            if (validation.valid) {
              updatedRow = { ...updatedRow, [column.key]: validation.parsedValue };
            }
          });

          // Use deep comparison that handles File objects
          let isDirty = false;
          const colMap = new Map(columns.map((c) => [c.key, c]));
          for (const key of Object.keys(rowState.original)) {
            const column = colMap.get(key as keyof TRow & string);
            const originalVal = (rowState.original as Record<string, unknown>)[key];
            const newVal = (updatedRow as Record<string, unknown>)[key];
            if (!isDeepEqual(originalVal, newVal, column?.type)) {
              isDirty = true;
              break;
            }
          }
          if (!isDirty) {
            for (const key of Object.keys(updatedRow)) {
              if (!(key in rowState.original)) {
                isDirty = true;
                break;
              }
            }
          }

          const validationErrors = validateRow({
            ...rowState,
            current: updatedRow,
            isDirty,
          });

          newRows[currentRowIndex] = {
            ...rowState,
            current: updatedRow,
            isDirty: isDirty || rowState.isNew,
            validationErrors,
          };
        });

        return newRows;
      });
    },
    [columns, createEmptyRow, getRowId, validateRow]
  );

  // Reset to initial data
  const resetToInitial = useCallback(() => {
    setRows(initializeRows(initialDataRef.current));
    setSelectedRows(new Set());
  }, [initializeRows]);

  // Get changes for saving
  const getChanges = useCallback(() => {
    const toCreate: TRow[] = [];
    const toUpdate: Array<{ id: string; row: TRow }> = [];
    const toDelete: string[] = [];

    rows.forEach((row) => {
      if (row.isDeleted && !row.isNew) {
        toDelete.push(getRowId(row.original));
      } else if (row.isNew && !row.isDeleted) {
        // Only include if valid
        if (Object.keys(row.validationErrors).length === 0) {
          toCreate.push(row.current);
        }
      } else if (row.isDirty && !row.isDeleted) {
        // Only include if valid
        if (Object.keys(row.validationErrors).length === 0) {
          toUpdate.push({ id: getRowId(row.original), row: row.current });
        }
      }
    });

    return { toCreate, toUpdate, toDelete };
  }, [rows, getRowId]);

  // Apply server errors back to rows
  const applyServerErrors = useCallback(
    (errors: Array<{ rowId: string; error: string }>) => {
      setRows((prev) => {
        const newRows = [...prev];
        errors.forEach(({ rowId, error }) => {
          const index = newRows.findIndex((r) => getRowId(r.current) === rowId || getRowId(r.original) === rowId);
          if (index !== -1) {
            newRows[index] = {
              ...newRows[index],
              validationErrors: {
                ...newRows[index].validationErrors,
                _server: error,
              },
            };
          }
        });
        return newRows;
      });
    },
    [getRowId]
  );

  // Derived stats
  const stats = useMemo(() => {
    const visibleRows = rows.filter((r) => !r.isDeleted);
    const dirtyCount = visibleRows.filter((r) => r.isDirty).length;
    const newCount = visibleRows.filter((r) => r.isNew).length;
    const deletedCount = rows.filter((r) => r.isDeleted).length;
    const invalidCount = visibleRows.filter((r) => Object.keys(r.validationErrors).length > 0).length;
    const hasChanges = dirtyCount > 0 || deletedCount > 0 || newCount > 0;

    return {
      hasChanges,
      dirtyCount,
      newCount,
      deletedCount,
      invalidCount,
    };
  }, [rows]);

  return {
    rows,
    setRows,
    selectedRows,
    setSelectedRows,
    addNewRow,
    selectAllRows,
    deleteSelectedRows,
    markRowDirty,
    validateRow,
    hasChanges: stats.hasChanges,
    dirtyCount: stats.dirtyCount,
    newCount: stats.newCount,
    deletedCount: stats.deletedCount,
    invalidCount: stats.invalidCount,
    resetToInitial,
    handlePaste,
    getChanges,
    applyServerErrors,
  };
}

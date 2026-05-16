import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { runBulkDeletes } from '@/utils/runBulkDeletes';
import type { MasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';

export interface MasterListBulkBarProps {
  entityPlural: string;
  totalCount: number;
  pageRowIds: string[];
  selection: MasterListBulkSelection;
  fetchAllMatchingIds: () => Promise<string[]>;
  deleteOne: (id: string) => Promise<unknown>;
  /** When provided, a single bulk-delete API call replaces looping individual deletes. */
  bulkDeleteAll?: (ids: string[]) => Promise<void>;
  disabled?: boolean;
  onAfterBulk?: () => void;
}

export function MasterListBulkBar({
  entityPlural,
  totalCount,
  pageRowIds,
  selection,
  fetchAllMatchingIds,
  deleteOne,
  bulkDeleteAll,
  disabled,
  onAfterBulk,
}: MasterListBulkBarProps) {
  const {
    selectedCount,
    clearSelection,
    selectPageOnly,
    selectAllMatching,
    isResolvingAll,
  } = selection;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const busy = Boolean(disabled) || isResolvingAll || isDeleting;
  const totalLabel = totalCount.toLocaleString();

  const runDelete = async () => {
    const ids = Array.from(selection.selectedIds);
    if (!ids.length) {
      setConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    try {
      const failures = await runBulkDeletes(ids, deleteOne, { bulkDeleteAll });
      const ok = ids.length - failures.length;
      if (failures.length === 0) {
        toast.success(`Deleted ${ok.toLocaleString()} ${entityPlural}.`);
        clearSelection();
        onAfterBulk?.();
      } else {
        toast.error(
          `Deleted ${ok.toLocaleString()}; ${failures.length.toLocaleString()} failed. First error: ${failures[0]?.error ?? 'unknown'}`,
        );
        clearSelection();
        onAfterBulk?.();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk delete failed.');
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (totalCount <= 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground mr-2">Bulk:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || pageRowIds.length === 0}
          onClick={() => selectPageOnly(pageRowIds)}
        >
          Select this page
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void selectAllMatching(fetchAllMatchingIds)}
        >
          {isResolvingAll ? 'Loading…' : `Select all ${totalLabel} matching`}
        </Button>
        {selectedCount > 0 && (
          <>
            <span className="text-muted-foreground pl-2">
              {selectedCount.toLocaleString()} selected
            </span>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={clearSelection}>
              Clear
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
            >
              Delete selected
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount.toLocaleString()} {entityPlural}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every selected record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                void runDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

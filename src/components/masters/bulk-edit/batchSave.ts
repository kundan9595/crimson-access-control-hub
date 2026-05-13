import { toast } from 'sonner';
import type { BatchSaveResult } from './types';
import type { UseMutateAsyncFunction } from '@tanstack/react-query';

interface BatchSaveOptions<TCreate, TUpdate> {
  toCreate: TCreate[];
  toUpdate: Array<{ id: string; row: TUpdate }>;
  toDelete: string[];
  createMutation: UseMutateAsyncFunction<unknown, Error, TCreate, unknown>;
  updateMutation: UseMutateAsyncFunction<unknown, Error, { id: string; updates: TUpdate }, unknown>;
  deleteMutation: UseMutateAsyncFunction<unknown, Error, string, unknown>;
  entityName: string;
  onProgress?: (completed: number, total: number) => void;
}

const BATCH_SIZE = 5;

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>
): Promise<Array<{ item: T; error?: string }>> {
  const errors: Array<{ item: T; error?: string }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          await fn(item);
        } catch (err) {
          throw { item, error: err instanceof Error ? err.message : 'Unknown error' };
        }
      })
    );

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        errors.push(result.reason);
      }
    });
  }

  return errors;
}

export async function batchSave<TCreate, TUpdate>({
  toCreate,
  toUpdate,
  toDelete,
  createMutation,
  updateMutation,
  deleteMutation,
  entityName,
  onProgress,
}: BatchSaveOptions<TCreate, TUpdate>): Promise<BatchSaveResult> {
  const total = toCreate.length + toUpdate.length + toDelete.length;
  let completed = 0;

  const result: BatchSaveResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    failed: 0,
    errors: [],
  };

  // Phase 1: Deletes (parallel, batched)
  if (toDelete.length > 0) {
    const deleteErrors = await runInBatches(
      toDelete,
      BATCH_SIZE,
      async (id) => {
        await deleteMutation(id);
        completed++;
        onProgress?.(completed, total);
      }
    );

    result.deleted = toDelete.length - deleteErrors.length;
    result.failed += deleteErrors.length;
    deleteErrors.forEach(({ item, error }) => {
      result.errors.push({ rowId: item, operation: 'delete', error: error || 'Delete failed' });
    });
  }

  // Phase 2: Updates (parallel, batched)
  if (toUpdate.length > 0) {
    const updateErrors = await runInBatches(
      toUpdate,
      BATCH_SIZE,
      async ({ id, row }) => {
        await updateMutation({ id, updates: row });
        completed++;
        onProgress?.(completed, total);
      }
    );

    result.updated = toUpdate.length - updateErrors.length;
    result.failed += updateErrors.length;
    updateErrors.forEach(({ item, error }) => {
      result.errors.push({ rowId: item.id, operation: 'update', error: error || 'Update failed' });
    });
  }

  // Phase 3: Creates (sequential to preserve order)
  for (const row of toCreate) {
    try {
      await createMutation(row);
      result.created++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        rowId: 'new',
        operation: 'create',
        error: err instanceof Error ? err.message : 'Create failed',
      });
    }
    completed++;
    onProgress?.(completed, total);
  }

  // Show summary toast
  const parts: string[] = [];
  if (result.created > 0) parts.push(`${result.created} created`);
  if (result.updated > 0) parts.push(`${result.updated} updated`);
  if (result.deleted > 0) parts.push(`${result.deleted} deleted`);

  if (result.failed === 0) {
    toast.success(`${entityName} bulk edit saved`, {
      description: parts.join(', ') || 'No changes to save',
    });
  } else {
    toast.error(`${entityName} bulk edit had ${result.failed} errors`, {
      description: `${parts.join(', ') || 'No changes'}. Check highlighted rows.`,
    });
  }

  return result;
}

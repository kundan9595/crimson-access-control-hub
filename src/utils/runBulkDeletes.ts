const DEFAULT_BATCH = 20;

export async function runBulkDeletes(
  ids: string[],
  deleteOne: (id: string) => Promise<unknown>,
  options?: {
    batchSize?: number;
    /** When provided, a single bulk-delete API call is used instead of looping individual deletes. */
    bulkDeleteAll?: (ids: string[]) => Promise<void>;
  },
): Promise<Array<{ id: string; error: string }>> {
  if (options?.bulkDeleteAll) {
    // Delegate to the server-side bulk delete — throws on failure so MasterListBulkBar catches it
    await options.bulkDeleteAll(ids);
    return [];
  }

  const batchSize = options?.batchSize ?? DEFAULT_BATCH;
  const failures: Array<{ id: string; error: string }> = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((id) => deleteOne(id)));
    results.forEach((res, idx) => {
      const id = batch[idx]!;
      if (res.status === 'rejected') {
        const err = res.reason;
        failures.push({
          id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  }
  return failures;
}

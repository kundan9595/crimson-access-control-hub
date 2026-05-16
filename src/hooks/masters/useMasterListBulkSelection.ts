import { useCallback, useState } from 'react';

export function useMasterListBulkSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isResolvingAll, setIsResolvingAll] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePageHeader = useCallback((pageRowIds: string[]) => {
    if (pageRowIds.length === 0) return;
    setSelectedIds((prev) => {
      const allOnPage = pageRowIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allOnPage) {
        pageRowIds.forEach((id) => next.delete(id));
      } else {
        pageRowIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const selectPageOnly = useCallback((pageRowIds: string[]) => {
    setSelectedIds(new Set(pageRowIds));
  }, []);

  const selectAllMatching = useCallback(async (fetchIds: () => Promise<string[]>) => {
    setIsResolvingAll(true);
    try {
      const ids = await fetchIds();
      setSelectedIds(new Set(ids));
    } finally {
      setIsResolvingAll(false);
    }
  }, []);

  const pageHeaderChecked = (pageRowIds: string[]): boolean | 'indeterminate' => {
    if (pageRowIds.length === 0) return false;
    const onPage = pageRowIds.filter((id) => selectedIds.has(id)).length;
    if (onPage === 0) return false;
    if (onPage === pageRowIds.length) return true;
    return 'indeterminate';
  };

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    clearSelection,
    toggleRow,
    togglePageHeader,
    selectPageOnly,
    selectAllMatching,
    isResolvingAll,
    pageHeaderChecked,
  };
}

export type MasterListBulkSelection = ReturnType<typeof useMasterListBulkSelection>;

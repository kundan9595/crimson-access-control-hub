import { useState, useCallback } from 'react';
import type { FilterGroup, FilterableColumn } from '@/components/masters/advanced-filter/types';
import { applyFilterGroup } from '@/components/masters/advanced-filter/filterEngine';

export function useAdvancedFilter() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    logic: 'and',
    conditions: [],
  });

  const isActive = filterGroup.conditions.length > 0;
  const activeCount = filterGroup.conditions.length;

  const applyFilter = useCallback(
    <T>(rows: T[], columns: FilterableColumn[]): T[] =>
      isActive ? applyFilterGroup(rows, filterGroup, columns) : rows,
    [filterGroup, isActive],
  );

  const clearFilters = useCallback(
    () => setFilterGroup({ logic: 'and', conditions: [] }),
    [],
  );

  return {
    filterGroup,
    setFilterGroup,
    isActive,
    activeCount,
    applyFilter,
    clearFilters,
  };
}

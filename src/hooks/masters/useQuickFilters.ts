import { useState, useCallback, useMemo } from 'react';
import type { FilterGroup, FilterableColumn } from '@/components/masters/advanced-filter/types';
import { applyFilterGroup } from '@/components/masters/advanced-filter/filterEngine';

/** Values stored per-column.
 * - enum  → single selected value string ('' = unset)
 * - date  → [from: string, to: string] (ISO date string, '' = unset)
 */
export type QuickFilterValues = Record<string, string | [string, string]>;

function buildFilterGroup(values: QuickFilterValues): FilterGroup {
  const conditions = Object.entries(values).flatMap(([key, val]) => {
    if (Array.isArray(val)) {
      const [from, to] = val;
      if (!from && !to) return [];
      if (from && to) {
        return [{
          id: `quick__${key}`,
          field: key,
          operator: 'date_between' as const,
          value: [from, to],
        }];
      }
      if (from) {
        return [{
          id: `quick__${key}__from`,
          field: key,
          operator: 'date_after' as const,
          value: from,
        }];
      }
      // only `to` set
      return [{
        id: `quick__${key}__to`,
        field: key,
        operator: 'date_before' as const,
        value: to,
      }];
    }
    // enum / single value
    if (!val) return [];
    return [{
      id: `quick__${key}`,
      field: key,
      operator: 'is_any_of' as const,
      value: [val],
    }];
  });
  return { logic: 'and', conditions };
}

export function useQuickFilters() {
  const [values, setValues] = useState<QuickFilterValues>({});

  const setEnumFilter = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setDateRange = useCallback((key: string, from: string, to: string) => {
    setValues((prev) => ({ ...prev, [key]: [from, to] }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setValues({}), []);

  const filterGroup = useMemo(() => buildFilterGroup(values), [values]);

  const isActive = filterGroup.conditions.length > 0;
  const activeCount = filterGroup.conditions.length;

  const applyQuickFilters = useCallback(
    <T>(rows: T[], columns: FilterableColumn[]): T[] =>
      isActive ? applyFilterGroup(rows, filterGroup, columns) : rows,
    [filterGroup, isActive],
  );

  return {
    values,
    setEnumFilter,
    setDateRange,
    clearFilter,
    clearAll,
    filterGroup,
    isActive,
    activeCount,
    applyQuickFilters,
  };
}

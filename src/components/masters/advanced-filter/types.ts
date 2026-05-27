import type { BulkEditColumn } from '../bulk-edit/types';

// ---------------------------------------------------------------------------
// Operator & Field type enums
// ---------------------------------------------------------------------------

export type FilterOperator =
  // text
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  // number
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  // enum
  | 'is_any_of'
  | 'is_none_of'
  // boolean
  | 'is_true'
  | 'is_false'
  // date
  | 'date_before'
  | 'date_after'
  | 'date_between'
  | 'date_on';

export type FilterFieldType = 'text' | 'integer' | 'decimal' | 'enum' | 'boolean' | 'date';

// ---------------------------------------------------------------------------
// Column descriptor (used by the filter panel & engine)
// ---------------------------------------------------------------------------

export interface FilterableColumn {
  key: string;
  name: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
}

// ---------------------------------------------------------------------------
// Filter condition & group
// ---------------------------------------------------------------------------

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  /** string | number | string[] | [number,number] | [string,string] | null */
  value: unknown;
}

export interface FilterGroup {
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

// ---------------------------------------------------------------------------
// Operator labels per field type
// ---------------------------------------------------------------------------

export const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'is exactly' },
    { value: 'not_equals', label: 'is not' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  integer: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
    { value: 'between', label: 'between' },
    { value: 'is_empty', label: 'is empty' },
  ],
  decimal: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
    { value: 'between', label: 'between' },
    { value: 'is_empty', label: 'is empty' },
  ],
  enum: [
    { value: 'is_any_of', label: 'is any of' },
    { value: 'is_none_of', label: 'is none of' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  date: [
    { value: 'date_on', label: 'is on' },
    { value: 'date_before', label: 'is before' },
    { value: 'date_after', label: 'is after' },
    { value: 'date_between', label: 'is between' },
  ],
};

/** Operators that do not need a value input */
export const NO_VALUE_OPERATORS = new Set<FilterOperator>([
  'is_empty',
  'is_not_empty',
  'is_true',
  'is_false',
]);

/** Operators that need two value inputs */
export const TWO_VALUE_OPERATORS = new Set<FilterOperator>(['between', 'date_between']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function defaultOperatorForType(type: FilterFieldType): FilterOperator {
  return OPERATORS_BY_TYPE[type][0].value;
}

/**
 * Merges two FilterGroups into one AND group (both must match).
 * Conditions from both groups are combined; empty groups are skipped.
 */
export function mergeFilterGroups(a: FilterGroup, b: FilterGroup): FilterGroup {
  const conditions = [...a.conditions, ...b.conditions];
  return { logic: 'and', conditions };
}

/**
 * Converts BulkEditColumn[] (from bulk-edit configs) into FilterableColumn[].
 * image / images / readonly columns are skipped (not filterable).
 * Two date columns (created_at, updated_at) are appended automatically.
 */
export function buildFilterColumns<TRow>(
  columns: BulkEditColumn<TRow>[],
  { includeDates = true }: { includeDates?: boolean } = {},
): FilterableColumn[] {
  const result: FilterableColumn[] = [];

  for (const col of columns) {
    if (col.type === 'image' || col.type === 'images' || col.type === 'readonly') continue;

    let type: FilterFieldType;
    switch (col.type) {
      case 'text':
        type = 'text';
        break;
      case 'integer':
        type = 'integer';
        break;
      case 'decimal':
        type = 'decimal';
        break;
      case 'enum':
        type = 'enum';
        break;
      case 'boolean':
        type = 'boolean';
        break;
      case 'hex':
      case 'url':
      default:
        type = 'text';
    }

    result.push({
      key: col.key as string,
      name: col.name,
      type,
      options: col.options?.map((o) => ({ value: o.value, label: o.label })),
    });
  }

  if (includeDates) {
    result.push({ key: 'created_at', name: 'Created At', type: 'date' });
    result.push({ key: 'updated_at', name: 'Updated At', type: 'date' });
  }

  return result;
}

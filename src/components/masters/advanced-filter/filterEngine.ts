import type { FilterGroup, FilterCondition, FilterableColumn } from './types';

// ---------------------------------------------------------------------------
// Internal: test a single row value against one condition
// ---------------------------------------------------------------------------

function getFieldValue(row: Record<string, unknown>, field: string): unknown {
  return row[field];
}

function testCondition(
  row: Record<string, unknown>,
  condition: FilterCondition,
  colType: string,
): boolean {
  const rawValue = getFieldValue(row, condition.field);
  const op = condition.operator;

  // Operators that don't need a value
  if (op === 'is_empty') {
    return rawValue === null || rawValue === undefined || rawValue === '';
  }
  if (op === 'is_not_empty') {
    return rawValue !== null && rawValue !== undefined && rawValue !== '';
  }
  if (op === 'is_true') {
    return rawValue === true || rawValue === 'true';
  }
  if (op === 'is_false') {
    return rawValue === false || rawValue === 'false' || rawValue === null || rawValue === undefined || rawValue === '';
  }

  // Text-like types
  if (colType === 'text' || colType === 'hex' || colType === 'url') {
    const str = String(rawValue ?? '').toLowerCase();
    const val = String(condition.value ?? '').toLowerCase();
    switch (op) {
      case 'contains':
        return str.includes(val);
      case 'not_contains':
        return !str.includes(val);
      case 'equals':
        return str === val;
      case 'not_equals':
        return str !== val;
      case 'starts_with':
        return str.startsWith(val);
      case 'ends_with':
        return str.endsWith(val);
    }
  }

  // Numeric types
  if (colType === 'integer' || colType === 'decimal') {
    const num = Number(rawValue);
    if (isNaN(num)) return false;

    if (op === 'between') {
      const [min, max] = condition.value as [number, number];
      const minNum = Number(min);
      const maxNum = Number(max);
      return num >= minNum && num <= maxNum;
    }

    const val = Number(condition.value);
    switch (op) {
      case 'equals':
        return num === val;
      case 'not_equals':
        return num !== val;
      case 'gt':
        return num > val;
      case 'gte':
        return num >= val;
      case 'lt':
        return num < val;
      case 'lte':
        return num <= val;
    }
  }

  // Enum type: value stored is the enum id (e.g. 'active', uuid)
  if (colType === 'enum') {
    const strVal = String(rawValue ?? '');
    const values = (condition.value as string[]) ?? [];
    switch (op) {
      case 'is_any_of':
        return values.length === 0 ? true : values.includes(strVal);
      case 'is_none_of':
        return values.length === 0 ? true : !values.includes(strVal);
    }
  }

  // Date type
  if (colType === 'date') {
    if (!rawValue) return false;
    const rowTs = new Date(rawValue as string).getTime();
    if (isNaN(rowTs)) return false;

    if (op === 'date_between') {
      const [from, to] = condition.value as [string, string];
      if (!from || !to) return true;
      const fromTs = new Date(from + 'T00:00:00').getTime();
      const toTs = new Date(to + 'T23:59:59').getTime();
      return rowTs >= fromTs && rowTs <= toTs;
    }

    const dateStr = condition.value as string;
    if (!dateStr) return true;
    const dayStart = new Date(dateStr + 'T00:00:00').getTime();
    const dayEnd = new Date(dateStr + 'T23:59:59').getTime();

    switch (op) {
      case 'date_on':
        return rowTs >= dayStart && rowTs <= dayEnd;
      case 'date_before':
        return rowTs < dayStart;
      case 'date_after':
        return rowTs > dayEnd;
    }
  }

  // boolean — handled by is_true/is_false above; fall-through returns true
  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Filters an array of rows using the given FilterGroup and column definitions.
 * Returns all rows if there are no conditions.
 */
export function applyFilterGroup<T>(
  rows: T[],
  group: FilterGroup,
  columns: FilterableColumn[],
): T[] {
  if (group.conditions.length === 0) return rows;

  const colTypeMap = new Map<string, string>(columns.map((c) => [c.key, c.type]));

  return rows.filter((row) => {
    const r = row as Record<string, unknown>;

    if (group.logic === 'and') {
      return group.conditions.every((cond) => {
        const colType = colTypeMap.get(cond.field) ?? 'text';
        return testCondition(r, cond, colType);
      });
    } else {
      return group.conditions.some((cond) => {
        const colType = colTypeMap.get(cond.field) ?? 'text';
        return testCondition(r, cond, colType);
      });
    }
  });
}

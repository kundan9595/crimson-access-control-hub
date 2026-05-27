import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterableColumn } from './types';
import type { QuickFilterValues } from '@/hooks/masters/useQuickFilters';

// Sentinel for "no selection" in Radix Select (empty string is reserved)
const ALL_VALUE = '__all__';

export interface QuickFilterBarProps {
  columns: FilterableColumn[];
  values: QuickFilterValues;
  onEnumChange: (key: string, value: string) => void;
  onDateChange: (key: string, from: string, to: string) => void;
  onClearField: (key: string) => void;
  onClearAll: () => void;
  /** Max number of enum columns to show inline before hiding rest (default: 4) */
  maxEnumColumns?: number;
  /** Whether to show date range pickers (default: false) */
  showDateFilters?: boolean;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  columns,
  values,
  onEnumChange,
  onDateChange,
  onClearField,
  onClearAll,
  maxEnumColumns = 4,
  showDateFilters = false,
}) => {
  const enumCols = columns
    .filter((c) => c.type === 'enum' && c.options && c.options.length > 0)
    .slice(0, maxEnumColumns);

  const dateCols = showDateFilters
    ? columns.filter((c) => c.type === 'date')
    : [];

  const hasAnyFilter =
    Object.values(values).some((v) => {
      if (Array.isArray(v)) return v[0] !== '' || v[1] !== '';
      return v !== '';
    });

  if (enumCols.length === 0 && dateCols.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Enum quick-filter dropdowns */}
      {enumCols.map((col) => {
        const current = (values[col.key] as string | undefined) ?? '';
        const isSet = current !== '';

        return (
          <div key={col.key} className="relative">
            <Select
              value={current || ALL_VALUE}
              onValueChange={(v) => {
                if (v === ALL_VALUE) {
                  onClearField(col.key);
                } else {
                  onEnumChange(col.key, v);
                }
              }}
            >
              <SelectTrigger
                className={`h-9 text-sm gap-1.5 pr-8 ${
                  isSet
                    ? 'border-primary/60 bg-primary/5 text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
                style={{ minWidth: `${Math.max(120, col.name.length * 8 + 64)}px` }}
              >
                <SelectValue>
                  {isSet
                    ? col.options?.find((o) => o.value === current)?.label ?? current
                    : `Filter by ${col.name}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE} className="text-muted-foreground">
                  All {col.name}s
                </SelectItem>
                {col.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Clear icon inside the trigger area */}
            {isSet && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClearField(col.key); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label={`Clear ${col.name} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Date range quick-filters */}
      {dateCols.map((col) => {
        const tuple = (values[col.key] as [string, string] | undefined) ?? ['', ''];
        const [from, to] = tuple;
        const isSet = from !== '' || to !== '';

        return (
          <div key={col.key} className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={from}
              onChange={(e) => onDateChange(col.key, e.target.value, to)}
              className={`h-9 w-36 text-sm ${isSet ? 'border-primary/60' : ''}`}
              aria-label={`${col.name} from`}
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => onDateChange(col.key, from, e.target.value)}
              className={`h-9 w-36 text-sm ${isSet ? 'border-primary/60' : ''}`}
              aria-label={`${col.name} to`}
            />
            {isSet && (
              <button
                type="button"
                onClick={() => onClearField(col.key)}
                className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label={`Clear ${col.name} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Clear all when any quick filter active */}
      {hasAnyFilter && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          onClick={onClearAll}
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
};

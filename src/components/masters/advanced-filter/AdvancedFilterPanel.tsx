import React, { useState, useCallback } from 'react';
import { Filter, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type {
  FilterableColumn,
  FilterCondition,
  FilterGroup,
  FilterFieldType,
  FilterOperator,
} from './types';
import {
  OPERATORS_BY_TYPE,
  NO_VALUE_OPERATORS,
  TWO_VALUE_OPERATORS,
  defaultOperatorForType,
} from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCondition(field: string, type: FilterFieldType): FilterCondition {
  const operator = defaultOperatorForType(type);
  return {
    id: crypto.randomUUID(),
    field,
    operator,
    value: type === 'enum' ? [] : '',
  };
}

function defaultValueForOperator(op: FilterOperator, type: FilterFieldType): unknown {
  if (NO_VALUE_OPERATORS.has(op)) return null;
  if (TWO_VALUE_OPERATORS.has(op)) return type === 'date' ? ['', ''] : [0, 0];
  if (type === 'enum') return [];
  if (type === 'integer' || type === 'decimal') return '';
  return '';
}

// ---------------------------------------------------------------------------
// Enum multi-select input
// ---------------------------------------------------------------------------

const EnumMultiSelect: React.FC<{
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-[140px] max-w-[240px] justify-start text-left font-normal truncate"
        >
          {selectedLabels.length === 0 ? (
            <span className="text-muted-foreground">Select values…</span>
          ) : selectedLabels.length <= 2 ? (
            <span className="truncate">{selectedLabels.join(', ')}</span>
          ) : (
            <span>{selectedLabels.length} selected</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" className="h-8" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => toggle(opt.value)}
                  className="gap-2"
                >
                  <Checkbox
                    checked={selected.includes(opt.value)}
                    onCheckedChange={() => toggle(opt.value)}
                    className="pointer-events-none"
                  />
                  <span>{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ---------------------------------------------------------------------------
// Value input for a single condition
// ---------------------------------------------------------------------------

const ConditionValueInput: React.FC<{
  condition: FilterCondition;
  column: FilterableColumn;
  onChange: (value: unknown) => void;
}> = ({ condition, column, onChange }) => {
  const { operator } = condition;

  if (NO_VALUE_OPERATORS.has(operator)) {
    return null;
  }

  // Enum — multi-select
  if (column.type === 'enum') {
    return (
      <EnumMultiSelect
        options={column.options ?? []}
        selected={(condition.value as string[]) ?? []}
        onChange={onChange}
      />
    );
  }

  // Date between — two date pickers
  if (operator === 'date_between') {
    const [from, to] = (condition.value as [string, string]) ?? ['', ''];
    return (
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={from}
          onChange={(e) => onChange([e.target.value, to])}
          className="h-8 w-36 text-xs"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChange([from, e.target.value])}
          className="h-8 w-36 text-xs"
        />
      </div>
    );
  }

  // Date — single picker
  if (column.type === 'date') {
    return (
      <Input
        type="date"
        value={(condition.value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-36 text-xs"
      />
    );
  }

  // Number between — two number inputs
  if (operator === 'between') {
    const [min, max] = (condition.value as [string | number, string | number]) ?? ['', ''];
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={String(min)}
          onChange={(e) => onChange([e.target.value, max])}
          className="h-8 w-20 text-xs"
          placeholder="min"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          value={String(max)}
          onChange={(e) => onChange([min, e.target.value])}
          className="h-8 w-20 text-xs"
          placeholder="max"
        />
      </div>
    );
  }

  // Number — single input
  if (column.type === 'integer' || column.type === 'decimal') {
    return (
      <Input
        type="number"
        value={String(condition.value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-28 text-xs"
        placeholder="value"
      />
    );
  }

  // Text (default) — single input
  return (
    <Input
      value={String(condition.value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 min-w-[140px] text-xs"
      placeholder="value"
    />
  );
};

// ---------------------------------------------------------------------------
// Single condition row
// ---------------------------------------------------------------------------

const ConditionRow: React.FC<{
  condition: FilterCondition;
  columns: FilterableColumn[];
  index: number;
  isFirst: boolean;
  logic: 'and' | 'or';
  onChange: (updated: FilterCondition) => void;
  onRemove: () => void;
}> = ({ condition, columns, index, isFirst, logic, onChange, onRemove }) => {
  const column = columns.find((c) => c.key === condition.field) ?? columns[0];
  const operators = OPERATORS_BY_TYPE[column.type] ?? OPERATORS_BY_TYPE.text;

  const handleFieldChange = (field: string) => {
    const col = columns.find((c) => c.key === field)!;
    const operator = defaultOperatorForType(col.type);
    onChange({
      ...condition,
      field,
      operator,
      value: defaultValueForOperator(operator, col.type),
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({
      ...condition,
      operator,
      value: defaultValueForOperator(operator, column.type),
    });
  };

  return (
    <div className="flex items-start gap-2">
      {/* AND / OR badge or WHERE label */}
      <div className="w-12 flex-shrink-0 pt-1.5 text-right">
        {isFirst ? (
          <span className="text-xs text-muted-foreground font-medium">Where</span>
        ) : (
          <span className="text-xs font-semibold text-primary uppercase">{logic}</span>
        )}
      </div>

      {/* Field selector */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {columns.map((col) => (
            <SelectItem key={col.key} value={col.key} className="text-xs">
              {col.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value} className="text-xs">
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      <div className="flex-1">
        <ConditionValueInput
          condition={condition}
          column={column}
          onChange={(value) => onChange({ ...condition, value })}
        />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel component
// ---------------------------------------------------------------------------

export interface AdvancedFilterPanelProps {
  columns: FilterableColumn[];
  filterGroup: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onClear: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  columns,
  filterGroup,
  onChange,
  onClear,
}) => {
  const [open, setOpen] = useState(false);

  const activeCount = filterGroup.conditions.length;
  const hasFilters = activeCount > 0;

  const addCondition = useCallback(() => {
    if (columns.length === 0) return;
    const col = columns[0];
    onChange({
      ...filterGroup,
      conditions: [...filterGroup.conditions, makeCondition(col.key, col.type)],
    });
  }, [columns, filterGroup, onChange]);

  const updateCondition = useCallback(
    (index: number, updated: FilterCondition) => {
      const conditions = filterGroup.conditions.map((c, i) => (i === index ? updated : c));
      onChange({ ...filterGroup, conditions });
    },
    [filterGroup, onChange],
  );

  const removeCondition = useCallback(
    (index: number) => {
      const conditions = filterGroup.conditions.filter((_, i) => i !== index);
      onChange({ ...filterGroup, conditions });
    },
    [filterGroup, onChange],
  );

  const toggleLogic = useCallback(() => {
    onChange({
      ...filterGroup,
      logic: filterGroup.logic === 'and' ? 'or' : 'and',
    });
  }, [filterGroup, onChange]);

  const handleClear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasFilters ? 'default' : 'outline'}
          size="sm"
          className="gap-2 h-9"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasFilters && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full px-1 text-xs font-bold"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[640px] p-0"
        onInteractOutside={(e) => {
          // Keep open when interacting with nested popovers (enum multi-select)
          const target = e.target as HTMLElement;
          if (target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Advanced Filters</span>
            {hasFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeCount} condition{activeCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              >
                Clear all
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Logic toggle (only visible when 2+ conditions) */}
        {filterGroup.conditions.length >= 2 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            <span className="text-xs text-muted-foreground">Match</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2 font-semibold"
              onClick={toggleLogic}
            >
              {filterGroup.logic === 'and' ? 'ALL' : 'ANY'}
            </Button>
            <span className="text-xs text-muted-foreground">
              of the following conditions
            </span>
          </div>
        )}

        {/* Conditions */}
        <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
          {filterGroup.conditions.length === 0 ? (
            <div className="text-center py-6">
              <Filter className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No filters applied</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Add a condition to filter rows
              </p>
            </div>
          ) : (
            filterGroup.conditions.map((condition, index) => (
              <ConditionRow
                key={condition.id}
                condition={condition}
                columns={columns}
                index={index}
                isFirst={index === 0}
                logic={filterGroup.logic}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={addCondition}
            disabled={columns.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Add filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

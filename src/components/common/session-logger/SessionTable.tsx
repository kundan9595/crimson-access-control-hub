import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { BaseActivityEntry, ActivitySession } from './types/sessionTypes';

interface TableColumn<T extends BaseActivityEntry> {
  key: string;
  header: string;
  width?: string;
  className?: string;
  render?: (entry: T, session: ActivitySession<T>) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface QuantityInput<T extends BaseActivityEntry> {
  field: string;
  label: string;
  min?: number;
  max?: (entry: T) => number;
  disabled?: (entry: T, session: ActivitySession<T>) => boolean;
  placeholder?: string | ((entry: T, session: ActivitySession<T>) => string);
}

interface SessionTableProps<T extends BaseActivityEntry> {
  session: ActivitySession<T>;
  columns: TableColumn<T>[];
  quantityInputs?: QuantityInput<T>[];
  onQuantityChange?: (entryId: string, field: string, value: number) => void;
  validationErrors?: Record<string, string>;
  emptyMessage?: string;
  className?: string;
}

export function SessionTable<T extends BaseActivityEntry>({
  session,
  columns,
  quantityInputs = [],
  onQuantityChange,
  validationErrors = {},
  emptyMessage = 'No items found for this session',
  className = ''
}: SessionTableProps<T>) {

  const renderQuantityInput = (entry: T, input: QuantityInput<T>) => {
    const errorKey = `${session.id}-${entry.id}-${input.field}`;
    const hasError = !!validationErrors[errorKey];
    const value = (entry[input.field] as number) || 0;
    const maxValue = input.max ? input.max(entry) : undefined;
    const isDisabled = input.disabled ? input.disabled(entry, session) : session.isSaved;

    // Get placeholder value
    const placeholderValue = typeof input.placeholder === 'function' 
      ? input.placeholder(entry, session)
      : input.placeholder || "0";

    return (
      <div className="space-y-1">
        <Input
          type="number"
          min={input.min || 0}
          max={maxValue}
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value) || 0;
            if (newValue < (input.min || 0)) return;
            if (maxValue !== undefined && newValue > maxValue) return;
            onQuantityChange?.(entry.id, input.field as string, newValue);
          }}
          className={`text-center ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
          disabled={isDisabled}
          placeholder={placeholderValue}
          aria-label={`${input.label} for ${entry.item_type === 'sku' ? entry.sku_code : entry.misc_name}`}
        />
        {hasError && (
          <p className="text-xs text-red-500">{validationErrors[errorKey]}</p>
        )}
      </div>
    );
  };

  const renderCell = (entry: T, column: TableColumn<T>) => {
    if (column.render) {
      return column.render(entry, session);
    }

    // Check if this is a quantity input column
    const quantityInput = quantityInputs.find(input => input.field === column.key);
    if (quantityInput) {
      return renderQuantityInput(entry, quantityInput);
    }

    // Default rendering based on column key
    switch (column.key) {
      case 'item_code':
        return entry.item_type === 'sku' ? entry.sku_code : 'MISC';
      
      case 'item_name':
        return entry.item_type === 'sku' 
          ? `${entry.sku_name} - ${entry.size_name}`
          : entry.misc_name;
      
      case 'ordered':
        return (entry.ordered || 0).toLocaleString();
      
      case 'total_received':
        const goodQty = (entry as any).goodQuantity || 0;
        const badQty = (entry as any).badQuantity || 0;
        const qty = (entry as any).quantity || 0;
        return (goodQty + badQty + qty).toLocaleString();
      
      case 'pending':
        const pending = (entry as any).pending || 0;
        return (
          <Badge 
            variant={pending === 0 ? "secondary" : "default"}
            className={pending === 0 ? "bg-green-100 text-green-800" : ""}
          >
            {pending.toLocaleString()}
          </Badge>
        );
      
      default:
        const value = (entry as any)[column.key];
        return typeof value === 'number' ? value.toLocaleString() : value || '-';
    }
  };

  const getAlignmentClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className={`overflow-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={`${column.width ? `w-[${column.width}]` : ''} ${getAlignmentClass(column.align)} ${column.className || ''}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {session.entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <div className="text-muted-foreground">{emptyMessage}</div>
              </TableCell>
            </TableRow>
          ) : (
            session.entries.map((entry) => (
              <TableRow key={entry.id}>
                {columns.map((column) => (
                  <TableCell 
                    key={`${entry.id}-${column.key}`}
                    className={`${getAlignmentClass(column.align)} ${column.className || ''}`}
                  >
                    {renderCell(entry, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { config } from '@/config/environment';
import type { ScottPaginatedResult } from '@/services/scott/scottPagination';
import { hasNextScottPage } from '@/services/scott/scottPagination';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type MasterServerPaginationProps<T> = {
  result: Pick<
    ScottPaginatedResult<T>,
    'page' | 'pageSize' | 'totalCount' | 'totalPages' | 'totalCountIsExact' | 'data'
  > | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** When data is loading, disable controls */
  disabled?: boolean;
  className?: string;
};

export function MasterServerPagination<T>({
  result,
  onPageChange,
  onPageSizeChange,
  disabled,
  className,
}: MasterServerPaginationProps<T>) {
  if (!result) return null;

  const page = result.page;
  const canPrev = page > 1;
  const canNext = hasNextScottPage(result as ScottPaginatedResult<T>);
  const sizeOptions = config.pagination.pageSizeOptions;

  const rangeStart = (page - 1) * result.pageSize + (result.data.length ? 1 : 0);
  const rangeEnd = (page - 1) * result.pageSize + result.data.length;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <div className="text-sm text-muted-foreground">
        {result.data.length === 0 ? (
          <span>No items on this page</span>
        ) : (
          <span>
            {rangeStart}–{rangeEnd}
            {result.totalCountIsExact ? (
              <> of {result.totalCount}</>
            ) : (
              <> (page {page})</>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
        <Select
          value={String(result.pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-[5.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={disabled || !canPrev}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[4rem] text-center tabular-nums">
            {result.totalCountIsExact ? (
              <>
                {page} / {result.totalPages}
              </>
            ) : (
              <>Page {page}</>
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={disabled || !canNext}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

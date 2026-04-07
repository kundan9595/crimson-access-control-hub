import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MasterTableSkeletonProps {
  /** Shimmer row mimicking search + optional view-toggle when data hasn’t loaded yet */
  showToolbar?: boolean;
  showViewToggle?: boolean;
  columnCount?: number;
  rowCount?: number;
  className?: string;
}

export const MasterTableSkeleton: React.FC<MasterTableSkeletonProps> = ({
  showToolbar = true,
  showViewToggle = false,
  columnCount = 5,
  rowCount = 8,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {showToolbar ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          {showViewToggle ? <Skeleton className="h-10 w-[11rem] shrink-0" /> : null}
        </div>
      ) : null}
      <div className="rounded-md border">
        <div className="flex gap-3 px-4 py-3 border-b bg-muted/30">
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 min-w-0" />
          ))}
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: rowCount }).map((_, ri) => (
            <div key={ri} className="flex gap-3 items-center">
              {Array.from({ length: columnCount }).map((_, ci) => (
                <Skeleton key={ci} className="h-9 flex-1 min-w-0" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export interface MasterListPageSkeletonProps extends MasterTableSkeletonProps {
  header: React.ReactNode;
  /** Most master list pages wrap content in a Card; Size Groups uses a bare bordered table */
  withCard?: boolean;
}

export const MasterListPageSkeleton: React.FC<MasterListPageSkeletonProps> = ({
  header,
  withCard = true,
  ...tableProps
}) => {
  const table = <MasterTableSkeleton {...tableProps} />;
  return (
    <div className="space-y-6">
      {header}
      {withCard ? (
        <Card>
          <CardContent className="p-6">{table}</CardContent>
        </Card>
      ) : (
        table
      )}
    </div>
  );
};

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  onEndReached,
  endReachedThreshold = 100,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);

    // Check if we're near the end
    if (onEndReached && !loading) {
      const scrollHeight = event.currentTarget.scrollHeight;
      const clientHeight = event.currentTarget.clientHeight;
      const isNearEnd = scrollTop + clientHeight >= scrollHeight - endReachedThreshold;
      
      if (isNearEnd) {
        onEndReached();
      }
    }
  }, [onScroll, onEndReached, loading, endReachedThreshold]);

  // Show empty state
  if (items.length === 0 && !loading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
      
      {/* Loading indicator at the bottom */}
      {loading && loadingComponent && (
        <div className="flex justify-center py-4">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// Hook for infinite scrolling
export function useInfiniteScroll<T>(
  items: T[],
  onLoadMore: () => void,
  options: {
    threshold?: number;
    loading?: boolean;
    hasMore?: boolean;
  } = {}
) {
  const { threshold = 100, loading = false, hasMore = true } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  return {
    scrollTop,
    handleScroll,
    handleEndReached,
    shouldLoadMore: hasMore && !loading
  };
}

// Optimized list item component
export const VirtualListItem = React.memo<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}>(({ children, className = '', onClick, selected }) => {
  return (
    <div
      className={`px-4 py-2 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
        selected ? 'bg-accent' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

VirtualListItem.displayName = 'VirtualListItem';

// Searchable virtual list
export interface SearchableVirtualListProps<T> extends VirtualListProps<T> {
  searchTerm: string;
  searchKeys: (keyof T)[];
  placeholder?: string;
  onSearchChange: (term: string) => void;
}

export function SearchableVirtualList<T>({
  items,
  searchTerm,
  searchKeys,
  placeholder = 'Search...',
  onSearchChange,
  ...virtualListProps
}: SearchableVirtualListProps<T>) {
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      searchKeys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(term);
      })
    );
  }, [items, searchTerm, searchKeys]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <VirtualList
        {...virtualListProps}
        items={filteredItems}
      />
    </div>
  );
}

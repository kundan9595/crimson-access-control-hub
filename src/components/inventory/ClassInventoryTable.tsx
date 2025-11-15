import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, AlertTriangle, MapPin } from 'lucide-react';
import { ClassInventoryView } from '@/services/inventory/types';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import StatisticsCards from './StatisticsCards';

interface ClassInventoryTableProps {
  // Data
  inventory: ClassInventoryView[];
  statistics: any;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  
  // Actions
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onLoadMore: () => void;
  onExport: () => void;
  onViewDetails?: (classId: string) => void;
  onViewLocations?: (classId: string) => void;
}

const ClassInventoryTable: React.FC<ClassInventoryTableProps> = ({
  inventory,
  statistics,
  loading,
  error,
  pagination,
  onSearch,
  onClearSearch,
  onLoadMore,
  onExport,
  onViewDetails,
  onViewLocations
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Log props when they change
  useEffect(() => {
    console.log('🔷 [ClassInventoryTable] Props updated:', {
      inventoryCount: inventory?.length || 0,
      statistics,
      loading,
      error,
      pagination,
      firstItem: inventory?.[0] || null
    });
  }, [inventory, statistics, loading, error, pagination]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    } else {
      onClearSearch();
    }
  };

  // Get stock status color
  const getStockStatusColor = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'destructive';
    if (availableQuantity < totalQuantity * 0.2) return 'destructive';
    if (availableQuantity < totalQuantity * 0.5) return 'secondary';
    return 'default';
  };

  // Get stock status text
  const getStockStatusText = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'Out of Stock';
    if (availableQuantity < totalQuantity * 0.2) return 'Low Stock';
    if (availableQuantity < totalQuantity * 0.5) return 'Medium Stock';
    return 'In Stock';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <StatisticsCards statistics={statistics} viewType="class" />

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class Inventory</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by brand, style, class, or color..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Search
              </Button>
              {searchQuery && (
                <Button type="button" variant="outline" onClick={onClearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Class Inventory Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size Group</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Reserve</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                  <TableHead className="text-center">SKUs</TableHead>
                  <TableHead className="text-center">Locations</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No class inventory found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item.class_id}>
                      <TableCell className="font-medium">{item.brand_name}</TableCell>
                      <TableCell>{item.style_name}</TableCell>
                      <TableCell className="font-medium">{item.class_name}</TableCell>
                      <TableCell>{item.color_name || '-'}</TableCell>
                      <TableCell>{item.size_group_name || '-'}</TableCell>
                      <TableCell className="text-center font-medium">{item.total_quantity}</TableCell>
                      <TableCell className="text-center">{item.reserved_quantity}</TableCell>
                      <TableCell className="text-center font-medium">{item.available_quantity}</TableCell>
                      <TableCell className="text-center">{item.sku_count}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewLocations?.(item.class_id)}
                          disabled={item.locations_count === 0}
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          {item.locations_count}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStockStatusColor(item.available_quantity, item.total_quantity)}>
                          {getStockStatusText(item.available_quantity, item.total_quantity)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load More */}
          {pagination.hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassInventoryTable; 
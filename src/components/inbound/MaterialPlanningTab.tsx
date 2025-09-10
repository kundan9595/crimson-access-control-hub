import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Search,
  RotateCcw,
  Calendar,
  Settings,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Package2,
  Filter,
  RefreshCw,
  ShoppingCart,
  Zap,
  ChevronDown
} from 'lucide-react';
import { useMaterialPlanning } from '@/hooks/inventory/useMaterialPlanning';
import { useRealtimeReorder } from '@/hooks/inventory/useRealtimeReorder';
import MaterialPlanningStatsCards from '@/components/inventory/MaterialPlanningStatsCards';
import {
  MaterialPlanningSearchParams,
  MaterialPlanningItem
} from '@/services/inventory/materialPlanningTypes';

const MaterialPlanningTab: React.FC = () => {
  const [searchParams, setSearchParams] = useState<MaterialPlanningSearchParams>({
    query: '',
    status_filter: 'all',
    threshold_type_filter: 'all',
    page: 1,
    limit: 50,
    sort_by: 'sku_code',
    sort_order: 'asc'
  });

  // State for vendor selection
  const [vendorSelections, setVendorSelections] = useState<Record<string, string>>({});

  const {
    data,
    statistics,
    filterOptions,
    isLoading,
    isLoadingStatistics,
    isLoadingFilterOptions,
    error,
    isError,
    isFetching,
    refetch,
    refresh,
    manualReorder,
    isManualReorderLoading,
    autoReorder,
    isAutoReorderLoading,
    updateAutoReorderSettings,
    isUpdatingAutoReorderSettings
  } = useMaterialPlanning(searchParams);

  // Real-time reorder monitoring
  const {
    pendingReorders,
    statistics: reorderStats,
    isPendingReordersLoading,
    isProcessingPending,
    processPendingReorders,
    refetchPendingReorders
  } = useRealtimeReorder();

  // Handle search with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchParams(prev => ({
      ...prev,
      query,
      page: 1 // Reset to first page when searching
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof MaterialPlanningSearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  }, []);

  // Handle reset filters
  const handleReset = useCallback(() => {
    setSearchParams({
      query: '',
      status_filter: 'all',
      threshold_type_filter: 'all',
      page: 1,
      limit: 50,
      sort_by: 'sku_code',
      sort_order: 'asc'
    });
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh.refreshAll();
    toast.success('Material planning data refreshed');
  }, [refresh]);

  // Handle manual reorder
  const handleManualReorder = useCallback((skuId: string) => {
    manualReorder(skuId);
  }, [manualReorder]);

  // Handle auto reorder toggle
  const handleAutoReorderToggle = useCallback((skuId: string, enabled: boolean) => {
    // If trying to enable auto reorder, check if vendor is selected
    if (enabled) {
      const currentVendorSelection = vendorSelections[skuId];
      const item = data?.items?.find(item => item.id === skuId);
      const hasVendor = currentVendorSelection || item?.preferred_vendor_id;
      
      if (!hasVendor) {
        toast.error('Please select a preferred vendor before enabling auto reorder');
        return;
      }
    }
    
    updateAutoReorderSettings({
      skuId,
      autoReorderEnabled: enabled
    });
  }, [updateAutoReorderSettings, vendorSelections, data?.items]);

  // Handle vendor selection
  const handleVendorSelection = useCallback((skuId: string, vendorId: string) => {
    setVendorSelections(prev => ({
      ...prev,
      [skuId]: vendorId
    }));
    
    // Find the current item to get its auto reorder state
    const item = data?.items?.find(item => item.id === skuId);
    
    // Update the auto reorder settings with the selected vendor (keep current enabled state)
    updateAutoReorderSettings({
      skuId,
      autoReorderEnabled: item?.auto_reorder_enabled || false,
      preferredVendorId: vendorId
    });
  }, [updateAutoReorderSettings, data?.items]);

  // Handle process all auto reorders
  const handleProcessAutoReorder = useCallback(() => {
    autoReorder();
  }, [autoReorder]);

  // Get status badge configuration
  const getStatusBadge = useCallback((status: MaterialPlanningItem['status']) => {
    const statusConfig = {
      'Normal': { 
        variant: 'secondary' as const, 
        className: 'bg-blue-100 text-blue-800',
        icon: Package2
      },
      'Low': { 
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle
      },
      'Critical': { 
        variant: 'secondary' as const, 
        className: 'bg-red-100 text-red-800',
        icon: AlertCircle
      },
      'Overstocked': { 
        variant: 'secondary' as const, 
        className: 'bg-purple-100 text-purple-800',
        icon: TrendingUp
      }
    };

    const config = statusConfig[status] || statusConfig['Normal'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  }, []);

  // Format class display name
  const formatClassDisplay = useCallback((item: MaterialPlanningItem) => {
    if (!item.class) return 'N/A';
    
    const parts = [];
    if (item.class.style?.brand?.name) parts.push(item.class.style.brand.name);
    if (item.class.style?.category?.name) parts.push(item.class.style.category.name);
    if (item.class.style?.name) parts.push(item.class.style.name);
    if (item.class.color?.name) parts.push(item.class.color.name);
    
    return parts.length > 0 ? parts.join(' - ') : item.class.name;
  }, []);

  // Show error state
  if (isError && error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Data</h3>
              <p className="text-sm text-gray-500 mb-4">
                {error?.message || 'An error occurred while loading material planning data'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <MaterialPlanningStatsCards 
        statistics={statistics} 
        isLoading={isLoadingStatistics} 
      />

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search SKU or description..."
                value={searchParams.query || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select 
              value={searchParams.status_filter || 'all'} 
              onValueChange={(value) => handleFilterChange('status_filter', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low Stock</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Overstocked">Overstocked</SelectItem>
              </SelectContent>
            </Select>

            {/* Threshold Type Filter */}
            <Select 
              value={searchParams.threshold_type_filter || 'all'} 
              onValueChange={(value) => handleFilterChange('threshold_type_filter', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by threshold type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threshold Types</SelectItem>
                <SelectItem value="overall">Overall Thresholds</SelectItem>
                <SelectItem value="monthly">Monthly Thresholds</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="flex-1"
              >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleProcessAutoReorder}
                disabled={isAutoReorderLoading}
                className="flex-1"
              >
                <Zap className={`w-4 h-4 mr-2 ${isAutoReorderLoading ? 'animate-pulse' : ''}`} />
                Auto Reorder
              </Button>
              
              {pendingReorders?.data && pendingReorders.data.length > 0 && (
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => processPendingReorders()}
                  disabled={isProcessingPending}
                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <AlertTriangle className={`w-4 h-4 mr-2 ${isProcessingPending ? 'animate-pulse' : ''}`} />
                  Process {pendingReorders.data.length} Pending
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Planning Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Material Planning Overview</CardTitle>
          {data && (
            <p className="text-sm text-muted-foreground">
              Showing {data.items.length} of {data.total_count} SKUs
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            // Loading skeleton
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : !data || data.items.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No SKUs Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchParams.query 
                    ? `No SKUs match your search criteria "${searchParams.query}"`
                    : 'No SKUs are available for material planning'
                  }
                </p>
                {searchParams.query && (
                  <Button variant="outline" onClick={handleReset}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Data table
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>SKU Code</TableHead>
                  <TableHead>Class Details</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Min Threshold</TableHead>
                  <TableHead className="text-right">Optimal Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto Reorder</TableHead>
                <TableHead>Preferred Vendor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{item.sku_code}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-32">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <div className="text-sm font-medium truncate">
                          {formatClassDisplay(item)}
                        </div>
                        {item.class?.name && (
                          <div className="text-xs text-muted-foreground">
                            Class: {item.class.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.size ? (
                        <Badge variant="outline" className="text-xs">
                          {item.size.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-semibold">{item.available_inventory}</div>
                        {item.reserved_inventory > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({item.reserved_inventory} reserved)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {item.min_threshold || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {item.optimal_threshold || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                  <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                    <Switch
                            checked={item.auto_reorder_enabled}
                            onCheckedChange={(enabled) => handleAutoReorderToggle(item.id, enabled)}
                            disabled={isUpdatingAutoReorderSettings}
                      className="data-[state=checked]:bg-primary"
                    />
                          <span className={`text-xs ${
                            item.auto_reorder_enabled 
                              ? 'text-green-600' 
                              : !item.preferred_vendor_id && !vendorSelections[item.id]
                                ? 'text-orange-600'
                                : 'text-muted-foreground'
                          }`}>
                            {item.auto_reorder_enabled 
                              ? 'Enabled' 
                              : !item.preferred_vendor_id && !vendorSelections[item.id]
                                ? 'Select vendor first'
                                : 'Disabled'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.threshold_source === 'monthly' ? (
                            <>
                              <Calendar className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                Monthly
                              </span>
                              {item.current_month && (
                                <span className="text-xs text-muted-foreground">
                                  (M{item.current_month})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Settings className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-blue-700 font-medium">
                                Overall
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <Select
                        value={vendorSelections[item.id] || item.preferred_vendor_id || ''}
                        onValueChange={(vendorId) => handleVendorSelection(item.id, vendorId)}
                        disabled={isLoadingFilterOptions}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            isLoadingFilterOptions 
                              ? "Loading vendors..." 
                              : "Select vendor"
                          } />
                      </SelectTrigger>
                      <SelectContent>
                          {isLoadingFilterOptions ? (
                            <SelectItem value="loading" disabled>
                              Loading vendors...
                            </SelectItem>
                          ) : (
                            filterOptions?.vendors?.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name} ({vendor.code})
                              </SelectItem>
                            )) || []
                          )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {(item.status === 'Low' || item.status === 'Critical') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManualReorder(item.id)}
                            disabled={isManualReorderLoading}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                      Reorder
                    </Button>
                        )}
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total_count > data.limit && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Page {data.page} of {Math.ceil(data.total_count / data.limit)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_previous_page}
                onClick={() => handleFilterChange('page', (data.page || 1) - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_next_page}
                onClick={() => handleFilterChange('page', (data.page || 1) + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaterialPlanningTab;

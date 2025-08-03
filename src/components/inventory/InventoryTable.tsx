import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Eye, Settings, Package, AlertTriangle, Download, Upload } from 'lucide-react';
import { WarehouseInventory } from '@/services/inventory/types';
import AddInventoryDialog from './AddInventoryDialog';
import InventoryLocationsModal from './InventoryLocationsModal';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

interface InventoryTableProps {
  // Data
  inventory: WarehouseInventory[];
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
  onAddSuccess: () => void;
  onBulkImportSuccess: () => void;
  onExport: () => void;
  
  // Configuration
  warehouseId?: string; // Optional - if not provided, shows global inventory
  warehouseStructure?: any; // Optional - needed for add inventory dialog
  showWarehouseColumn?: boolean; // Whether to show warehouse column (for global view)
  title?: string; // Custom title for the table
  showAddButton?: boolean; // Whether to show add inventory button
  showBulkImport?: boolean; // Whether to show bulk import button
  showExport?: boolean; // Whether to show export button
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  statistics,
  loading,
  error,
  pagination,
  onSearch,
  onClearSearch,
  onLoadMore,
  onAddSuccess,
  onBulkImportSuccess,
  onExport,
  warehouseId,
  warehouseStructure,
  showWarehouseColumn = false,
  title = "Inventory",
  showAddButton = true,
  showBulkImport = true,
  showExport = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<WarehouseInventory | null>(null);
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    } else {
      onClearSearch();
    }
  };

  // Handle view locations
  const handleViewLocations = (inventory: WarehouseInventory) => {
    setSelectedInventory(inventory);
    setIsLocationsModalOpen(true);
  };

  // Handle add inventory success
  const handleAddSuccess = () => {
    onAddSuccess();
    toast.success('Inventory added successfully');
  };

  // Handle bulk import success
  const handleBulkImportSuccess = () => {
    onBulkImportSuccess();
    toast.success('Bulk import completed successfully');
  };

  // Get stock status color
  const getStockStatusColor = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'bg-red-100 text-red-800';
    if (availableQuantity <= totalQuantity * 0.1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Get stock status text
  const getStockStatusText = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'Out of Stock';
    if (availableQuantity <= totalQuantity * 0.1) return 'Low Stock';
    return 'In Stock';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Inventory</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{statistics?.total_items || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold">{statistics?.total_quantity || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Reserved</p>
                <p className="text-2xl font-bold">{statistics?.reserved_quantity || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold">{statistics?.available_quantity || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            <div className="flex items-center gap-2">
              {showExport && (
                <Button variant="outline" onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
              {showBulkImport && (
                <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              )}
              {showAddButton && warehouseId && warehouseStructure && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Inventory
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearch} className={title ? "mb-6" : "mb-4"}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by brand, SKU code, or product name..."
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

          {/* Inventory Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {showWarehouseColumn && <TableHead>Warehouse</TableHead>}
                  <TableHead>Brand</TableHead>
                  <TableHead>SKU Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Reserve</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Locations</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {showWarehouseColumn && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showWarehouseColumn ? 10 : 9} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <Package className="w-12 h-12 text-gray-400" />
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No inventory found' : 'No inventory items yet'}
                          </h3>
                          <p className="text-gray-500 mb-4">
                            {searchQuery 
                              ? 'No inventory found matching your search criteria.' 
                              : 'Get started by adding your first inventory item.'
                            }
                          </p>
                          {!searchQuery && showAddButton && warehouseId && warehouseStructure && (
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Item
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => (
                    <TableRow key={item.id}>
                      {showWarehouseColumn && (
                        <TableCell className="font-medium">
                          {item.warehouse?.name || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {item.sku?.class?.style?.brand?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.sku?.sku_code || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.sku?.class?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.sku?.class?.style?.name} | {item.sku?.class?.color?.name} | {item.sku?.class?.size?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {item.total_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.reserved_quantity > 0 ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {item.reserved_quantity}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {item.available_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary" 
                          className={getStockStatusColor(item.available_quantity, item.total_quantity)}
                        >
                          {getStockStatusText(item.available_quantity, item.total_quantity)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLocations(item)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View locations ({item.locations?.length || 0})
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load More Button */}
          {pagination.hasMore && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          {inventory.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing {inventory.length} of {pagination.total} items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Inventory Dialog */}
      {warehouseId && warehouseStructure && (
        <AddInventoryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          warehouseId={warehouseId}
          warehouseStructure={warehouseStructure}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Locations Modal */}
      <InventoryLocationsModal
        open={isLocationsModalOpen}
        onOpenChange={setIsLocationsModalOpen}
        inventory={selectedInventory}
        showWarehouseColumn={showWarehouseColumn}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="inventory"
      />
    </div>
  );
};

export default InventoryTable; 
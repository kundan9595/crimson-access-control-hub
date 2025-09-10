import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

// Import optimized hooks and components
import { useWarehouseData } from '@/hooks/warehouse/useWarehouseData';
import { useWarehouseOperations } from '@/hooks/warehouse/useWarehouseOperations';

import WarehouseCard from '@/components/warehouse/components/WarehouseCard';
import CreateWarehouseDialog from '@/components/warehouse/dialogs/CreateWarehouseDialog/index';
import EditWarehouseDialog from '@/components/warehouse/EditWarehouseDialog';
import WarehouseErrorBoundary from '@/components/warehouse/components/WarehouseErrorBoundary';
import { warehouseServiceOptimized } from '@/services/warehouseServiceOptimized';

const WarehousePageOptimized: React.FC = () => {

  const navigate = useNavigate();

  // State management
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  
  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<any>(null);

  // Optimized hooks
  const {
    warehouses,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    refreshData,
    loadMore,
    clearCache
  } = useWarehouseData({
    page: pagination.page,
    limit: pagination.limit,
    status: 'all',
    searchQuery: '',
    enableCache: true
  });

  const {
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById,
    loading: operationsLoading,
    error: operationsError
  } = useWarehouseOperations();

  // Performance monitoring - removed to prevent infinite re-renders

  // Handle warehouse operations
  const handleCreateWarehouse = async (data: any) => {
    try {
      const newWarehouse = await createWarehouse(data);
      if (newWarehouse) {
        toast.success('Warehouse created successfully');
        // Clear cache and force refresh the data to show the new warehouse
        clearCache();
        await refreshData();
        setIsCreateDialogOpen(false);
      } else {
        toast.error('Failed to create warehouse');
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast.error('Failed to create warehouse');
    }
  };

  const handleEditWarehouse = async (warehouse: any) => {
    try {
      const completeWarehouse = await getWarehouseById(warehouse.id);
      if (completeWarehouse) {
        setSelectedWarehouse(completeWarehouse);
        setIsEditDialogOpen(true);
      } else {
        toast.error('Failed to load warehouse details for editing');
      }
    } catch (error) {
      console.error('Error loading warehouse for edit:', error);
      toast.error('Failed to load warehouse details for editing');
    }
  };

  const handleUpdateWarehouse = async (id: string, data: any) => {
    try {
      await updateWarehouse(id, data);
      toast.success('Warehouse updated successfully');
      clearCache();
      await refreshData();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update warehouse');
    }
  };

  const handleViewWarehouse = (warehouse: any) => {
    // Navigate to the warehouse details page
    navigate(`/warehouse/${warehouse.id}`);
  };

  const handleDeleteWarehouse = async (warehouse: any) => {
    setWarehouseToDelete(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const handleSetPrimaryWarehouse = async (warehouse: any) => {
    try {
      // First check if the primary warehouse feature is available
      const isFeatureAvailable = await warehouseServiceOptimized.isPrimaryWarehouseFeatureAvailable();
      
      if (!isFeatureAvailable) {
        toast.error('Primary warehouse feature is not available. Please run the database migration first.');
        return;
      }

      await warehouseServiceOptimized.setPrimaryWarehouse(warehouse.id);
      toast.success(`${warehouse.name} is now the primary warehouse`);
      
      // Clear cache and refresh data to show updated primary status
      clearCache();
      await refreshData();
      
      // Force multiple refreshes to ensure UI updates properly
      setTimeout(() => {
        refreshData();
      }, 200);
      
      setTimeout(() => {
        refreshData();
      }, 500);
    } catch (error) {
      console.error('Error setting primary warehouse:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set primary warehouse';
      toast.error(errorMessage);
    }
  };

  const confirmDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;

    try {
      await deleteWarehouse(warehouseToDelete.id);
      toast.success('Warehouse deleted successfully');
      clearCache();
      await refreshData();
      setIsDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error('Failed to delete warehouse');
    }
  };

  const cancelDeleteWarehouse = () => {
    setIsDeleteDialogOpen(false);
    setWarehouseToDelete(null);
  };

  // Loading skeletons
  const renderSkeletons = () => {
    const skeletons = Array.from({ length: pagination.limit }, (_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons}
      </div>
    );
  };

  return (
    <WarehouseErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
            <p className="text-muted-foreground">
              Manage your warehouse locations and configurations
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Warehouse Grid */}
        <div className="space-y-4">
          {loading && warehouses.length === 0 ? (
            renderSkeletons()
          ) : warehouses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No warehouses found</h3>
                <p className="text-gray-500 mb-4">
                  Get started by creating your first warehouse
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Warehouse
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.map((warehouse) => (
                  <WarehouseCard
                    key={warehouse.id}
                    warehouse={warehouse}
                    onView={handleViewWarehouse}
                    onEdit={handleEditWarehouse}
                    onDelete={handleDeleteWarehouse}
                    onSetPrimary={handleSetPrimaryWarehouse}
                    loading={operationsLoading}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center text-sm text-gray-500">
                Showing {warehouses.length} of {totalCount} warehouses
              </div>
            </>
          )}
        </div>

        {/* Dialogs */}
        <CreateWarehouseDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSave={handleCreateWarehouse}
        />

        {selectedWarehouse && (
          <>
            <EditWarehouseDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              warehouse={selectedWarehouse}
              onSave={(data) => handleUpdateWarehouse(selectedWarehouse.id, data)}
            />
          </>
        )}



        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>"{warehouseToDelete?.name}"</strong>? 
                This action cannot be undone and will permanently remove the warehouse and all its associated floors, lanes, and racks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteWarehouse}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteWarehouse}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Warehouse
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </WarehouseErrorBoundary>
  );
};

export default WarehousePageOptimized; 
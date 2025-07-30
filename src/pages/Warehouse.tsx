import React, { useState } from 'react';
import { useWarehouses } from '@/hooks/useWarehouses';
import { warehouseService } from '@/services/warehouseService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CreateWarehouseDialog from '@/components/warehouse/CreateWarehouseDialog';
import ViewWarehouseDialog from '@/components/warehouse/ViewWarehouseDialog';
import EditWarehouseDialog from '@/components/warehouse/EditWarehouseDialog';
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

const Warehouse: React.FC = () => {
  const { 
    warehouses, 
    loading, 
    error, 
    createWarehouse, 
    updateWarehouse, 
    deleteWarehouse 
  } = useWarehouses();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);

  const handleCreateWarehouse = async (data: any) => {
    const result = await createWarehouse(data);
    if (result) {
      setIsCreateDialogOpen(false);
    }
  };

  const handleViewWarehouse = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setIsViewDialogOpen(true);
  };

  const handleEditWarehouse = async (warehouse: any) => {
    try {
      // Fetch complete warehouse data for editing
      const completeWarehouse = await warehouseService.getWarehouseById(warehouse.id);
      if (completeWarehouse) {
        console.log('Complete warehouse data for editing:', completeWarehouse);
        console.log('Floors:', completeWarehouse.floors);
        console.log('First floor lanes:', completeWarehouse.floors?.[0]?.lanes);
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

  const handleDeleteWarehouse = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedWarehouse) {
      await deleteWarehouse(selectedWarehouse.id);
      setIsDeleteDialogOpen(false);
      setSelectedWarehouse(null);
    }
  };

  const handleEditSave = async (data: any) => {
    if (selectedWarehouse) {
      const result = await updateWarehouse(selectedWarehouse.id, data);
      if (result) {
        setIsEditDialogOpen(false);
        setSelectedWarehouse(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Warehouses</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600 mt-1">
            Manage your warehouse locations and configurations
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouse Grid */}
      {warehouses.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Warehouses Found
            </h3>
            <p className="text-gray-600 mb-4 text-center">
              Get started by creating your first warehouse
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Warehouse
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {warehouse.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={getStatusColor(warehouse.status || 'active')}
                      >
                        {warehouse.status || 'Active'}
                      </Badge>
                      {warehouse.city && warehouse.state && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mr-1" />
                          {warehouse.city}, {warehouse.state}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewWarehouse(warehouse)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditWarehouse(warehouse)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWarehouse(warehouse)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {warehouse.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {warehouse.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Building2 className="w-4 h-4 text-blue-600 mr-1" />
                      </div>
                      <p className="font-semibold text-gray-900">{warehouse.floors_count}</p>
                      <p className="text-gray-600">Floors</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <MapPin className="w-4 h-4 text-green-600 mr-1" />
                      </div>
                      <p className="font-semibold text-gray-900">{warehouse.lanes_count}</p>
                      <p className="text-gray-600">Lanes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Package className="w-4 h-4 text-purple-600 mr-1" />
                      </div>
                      <p className="font-semibold text-gray-900">{warehouse.racks_count}</p>
                      <p className="text-gray-600">Racks</p>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Created {warehouse.created_at ? formatDate(warehouse.created_at) : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateWarehouseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreateWarehouse}
      />

      <ViewWarehouseDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        warehouse={selectedWarehouse}
      />

      <EditWarehouseDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        warehouse={selectedWarehouse}
        onSave={handleEditSave}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to <strong>permanently delete</strong> <strong>"{selectedWarehouse?.name}"</strong>? This action cannot be undone and all data will be permanently removed.
              </p>
              
              {selectedWarehouse && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">The following will be permanently deleted:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• {selectedWarehouse.floors_count} floor(s)</li>
                    <li>• {selectedWarehouse.lanes_count} lane(s)</li>
                    <li>• {selectedWarehouse.racks_count} rack(s)</li>
                    <li>• All lane configurations</li>
                    <li>• Any zone assignments referencing this warehouse</li>
                  </ul>
                  <p className="text-xs text-red-600 mt-2 font-medium">⚠️ This is a permanent deletion - data cannot be recovered!</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Permanently Delete Warehouse & All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Warehouse; 
import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPin,
  Package,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Edit,
  Trash2,
  ArrowLeft as BackArrow,
  Star,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

// Import hooks and services
import { useWarehouseOperations } from '@/hooks/warehouse/useWarehouseOperations';
import EditWarehouseDialog from '@/components/warehouse/EditWarehouseDialog';
import { warehouseServiceOptimized } from '@/services/warehouseServiceOptimized';
import InventoryTab from '@/components/inventory/InventoryTab';
import RackInventoryModal from '@/components/inventory/RackInventoryModal';
import { inventoryService } from '@/services/inventory/inventoryService';
import AppointWarehouseAdminDialog from '@/components/warehouse/AppointWarehouseAdminDialog';
import WarehouseAdminCard from '@/components/warehouse/WarehouseAdminCard';

interface WarehouseDetailsProps {}

const WarehouseDetails: React.FC<WarehouseDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAppointAdminDialogOpen, setIsAppointAdminDialogOpen] = useState(false);
  
  // Rack modal state
  const [isRackModalOpen, setIsRackModalOpen] = useState(false);
  const [selectedRack, setSelectedRack] = useState<any>(null);
  const [rackInventoryQuantities, setRackInventoryQuantities] = useState<Record<string, number>>({});

  const {
    updateWarehouse,
    deleteWarehouse,
    loading: operationsLoading,
    error: operationsError
  } = useWarehouseOperations();

  // Fetch warehouse details
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!id) {
        setError('Warehouse ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const warehouseData = await warehouseServiceOptimized.getWarehouseById(id);
        
        if (!warehouseData) {
          setError('Warehouse not found');
          setLoading(false);
          return;
        }

        setWarehouse(warehouseData);
      } catch (err) {
        console.error('Error fetching warehouse:', err);
        setError('Failed to load warehouse details');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [id]);

  // Fetch rack inventory quantities when warehouse data is loaded
  useEffect(() => {
    if (warehouse?.floors) {
      fetchRackInventoryQuantities();
    }
  }, [warehouse]);

  const getTotalRacks = (floor: any): number => {
    if (!floor.lanes || !Array.isArray(floor.lanes)) return 0;
    return floor.lanes.reduce((total: number, lane: any) => {
      return total + (lane.racks?.length || 0);
    }, 0);
  };

  // Calculate total floors count
  const getFloorsCount = (): number => {
    return warehouse?.floors?.length || 0;
  };

  // Calculate total lanes count across all floors
  const getLanesCount = (): number => {
    if (!warehouse?.floors || !Array.isArray(warehouse.floors)) return 0;
    return warehouse.floors.reduce((total: number, floor: any) => {
      return total + (floor.lanes?.length || 0);
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const handleEditWarehouse = () => {
    setIsEditDialogOpen(true);
  };

  const handleUpdateWarehouse = async (id: string, data: any) => {
    try {
      const updatedWarehouse = await updateWarehouse(id, data);
      if (updatedWarehouse) {
        toast.success('Warehouse updated successfully');
        // Refresh the warehouse data
        const refreshedData = await warehouseServiceOptimized.getWarehouseById(id);
        setWarehouse(refreshedData);
        setIsEditDialogOpen(false);
      }
    } catch (err) {
      console.error('Error updating warehouse:', err);
      toast.error('Failed to update warehouse');
    }
  };

  const handleDeleteWarehouse = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleSetPrimaryWarehouse = async () => {
    if (!warehouse?.id) return;

    try {
      await warehouseServiceOptimized.setPrimaryWarehouse(warehouse.id);
      toast.success(`${warehouse.name} is now the primary warehouse`);
      // Refresh the warehouse data to show updated primary status
      const refreshedData = await warehouseServiceOptimized.getWarehouseById(warehouse.id);
      setWarehouse(refreshedData);
    } catch (error) {
      console.error('Error setting primary warehouse:', error);
      toast.error('Failed to set primary warehouse');
    }
  };

  const handleAppointAdmin = () => {
    setIsAppointAdminDialogOpen(true);
  };

  const handleAdminAppointed = async () => {
    if (!warehouse?.id) return;
    
    try {
      // Refresh the warehouse data to show updated admin
      const refreshedData = await warehouseServiceOptimized.getWarehouseById(warehouse.id);
      setWarehouse(refreshedData);
      
      // Show success message
      toast.success('Warehouse admin updated successfully!', {
        description: 'The warehouse admin has been changed.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing warehouse data:', error);
      toast.error('Failed to refresh warehouse data');
    }
  };

  const confirmDeleteWarehouse = async () => {
    if (!warehouse?.id) return;

    try {
      await deleteWarehouse(warehouse.id);
      toast.success('Warehouse deleted successfully');
      navigate('/warehouse');
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      toast.error('Failed to delete warehouse');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const cancelDeleteWarehouse = () => {
    setIsDeleteDialogOpen(false);
  };

  // Fetch inventory counts for all racks
  const fetchRackInventoryQuantities = async () => {
    if (!warehouse?.floors) return;
    
    const quantities: Record<string, number> = {};
    
    for (const floor of warehouse.floors) {
      for (const lane of floor.lanes || []) {
        for (const rack of lane.racks || []) {
          try {
            const quantity = await inventoryService.getInventoryQuantityByRack(rack.id);
            quantities[rack.id] = quantity;
          } catch (error) {
            console.error(`Error fetching quantity for rack ${rack.id}:`, error);
            quantities[rack.id] = 0;
          }
        }
      }
    }
    
    setRackInventoryQuantities(quantities);
  };

  // Handle rack click
  const handleRackClick = (rack: any, floor: any, lane: any) => {
    setSelectedRack({
      ...rack,
      floorName: floor.name,
      laneName: lane.name
    });
    setIsRackModalOpen(true);
  };

  // Handle rack inventory added
  const handleRackInventoryAdded = async () => {
    // Refresh rack inventory counts when inventory is added from rack modal
    await fetchRackInventoryQuantities();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Not Found</h1>
          <p className="text-gray-600">{error || 'The requested warehouse could not be found.'}</p>
          <Button onClick={() => navigate('/warehouse')}>
            <BackArrow className="w-4 h-4 mr-2" />
            Back to Warehouses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/warehouse')}
            className="flex items-center gap-2"
          >
            <BackArrow className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            {warehouse.hasOwnProperty('is_primary') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSetPrimaryWarehouse}
                disabled={operationsLoading}
                className="p-1 h-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                title={warehouse.is_primary ? "Primary Warehouse" : "Set as Primary"}
              >
                <Star className={`w-5 h-5 ${warehouse.is_primary ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleEditWarehouse} disabled={operationsLoading}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteWarehouse}
            disabled={operationsLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Warehouse Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Warehouse Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Floors</p>
                <p className="font-semibold">{getFloorsCount()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Lanes</p>
                <p className="font-semibold">{getLanesCount()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Racks</p>
                <p className="font-semibold">
                  {warehouse.floors?.reduce((total: number, floor: any) =>
                    total + getTotalRacks(floor), 0
                  ) || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold text-sm">
                  {warehouse.created_at ? formatDate(warehouse.created_at) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(warehouse.status || 'active')}>
              {warehouse.status || 'Active'}
            </Badge>
            {warehouse.is_primary && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                Primary
              </Badge>
            )}
            {warehouse.city && warehouse.state && (
              <span className="text-sm text-gray-600">
                📍 {warehouse.city}, {warehouse.state}
              </span>
            )}
          </div>

          {warehouse.description && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-sm">{warehouse.description}</p>
            </div>
          )}

          {warehouse.address && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="text-sm">{warehouse.address}</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Warehouse Admin Card */}
        <div className="lg:col-span-1">
          <WarehouseAdminCard
            warehouseId={warehouse.id}
            warehouseName={warehouse.name}
            currentAdminId={warehouse.warehouse_admin_id || null}
            onAppointAdmin={handleAppointAdmin}
          />
        </div>
      </div>

      {/* Detailed Structure */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="racks">Rack Details</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryTab 
            warehouseId={warehouse.id} 
            warehouseStructure={warehouse}
          />
        </TabsContent>



        <TabsContent value="racks" className="space-y-4">
          {warehouse.floors && warehouse.floors.length > 0 ? (
            <Tabs defaultValue={`floor-${warehouse.floors[0]?.id || 0}`} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${warehouse.floors.length}, 1fr)` }}>
                {warehouse.floors.map((floor: any, floorIndex: number) => (
                  <TabsTrigger key={floor.id || floorIndex} value={`floor-${floor.id || floorIndex}`}>
                    Floor {floor.floor_number || floorIndex + 1}: {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {warehouse.floors.map((floor: any, floorIndex: number) => (
                <TabsContent key={floor.id || floorIndex} value={`floor-${floor.id || floorIndex}`} className="space-y-4">
                  {floor.lanes && floor.lanes.length > 0 ? (
                    <div className="space-y-4">
                      {floor.lanes.map((lane: any, laneIndex: number) => (
                        <Card key={lane.id || laneIndex}>
                          <CardHeader>
                            <CardTitle className="text-md">
                            Lane {lane.lane_number || laneIndex + 1}: {lane.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                          {lane.racks && lane.racks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Side Racks */}
                              {lane.config?.left_side_enabled && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" />
                                    Left Side
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {lane.racks
                                      .filter((rack: any) => rack.side === 'left')
                                        .map((rack: any, rackIndex: number) => {
                                          const inventoryQuantity = rackInventoryQuantities[rack.id] || 0;
                                          return (
                                            <Button
                                              key={rack.id || rackIndex}
                                              variant={inventoryQuantity > 0 ? "default" : "outline"}
                                              className={`h-auto p-3 flex flex-col items-center gap-1 transition-colors ${
                                                inventoryQuantity > 0 
                                                  ? "bg-green-50 border-green-300 hover:bg-green-100 text-green-800" 
                                                  : "hover:bg-gray-50 hover:border-gray-300 text-gray-600"
                                              }`}
                                              onClick={() => handleRackClick(rack, floor, lane)}
                                            >
                                              <span className="text-sm font-medium">
                                          {rack.rack_name || `Rack ${rack.rack_number || rackIndex + 1}`}
                                              </span>
                                              {inventoryQuantity > 0 && (
                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                  {inventoryQuantity} units
                                                </Badge>
                                              )}
                                            </Button>
                                          );
                                        })}
                                  </div>
                                </div>
                              )}

                              {/* Right Side Racks */}
                              {lane.config?.right_side_enabled && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    Right Side
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {lane.racks
                                      .filter((rack: any) => rack.side === 'right')
                                        .map((rack: any, rackIndex: number) => {
                                          const inventoryQuantity = rackInventoryQuantities[rack.id] || 0;
                                          return (
                                            <Button
                                              key={rack.id || rackIndex}
                                              variant={inventoryQuantity > 0 ? "default" : "outline"}
                                              className={`h-auto p-3 flex flex-col items-center gap-1 transition-colors ${
                                                inventoryQuantity > 0 
                                                  ? "bg-green-50 border-green-300 hover:bg-green-100 text-green-800" 
                                                  : "hover:bg-gray-50 hover:border-gray-300 text-gray-600"
                                              }`}
                                              onClick={() => handleRackClick(rack, floor, lane)}
                                            >
                                              <span className="text-sm font-medium">
                                          {rack.rack_name || `Rack ${rack.rack_number || rackIndex + 1}`}
                                              </span>
                                              {inventoryQuantity > 0 && (
                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                  {inventoryQuantity} units
                                                </Badge>
                                              )}
                                            </Button>
                                          );
                                        })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No racks configured</p>
                          )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-gray-500 text-center">No lanes configured</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-gray-500 text-center">No floors configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {warehouse && (
        <EditWarehouseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          warehouse={warehouse}
          onSave={(data) => handleUpdateWarehouse(warehouse.id, data)}
        />
      )}

      {/* Appoint Warehouse Admin Dialog */}
      {warehouse && (
        <AppointWarehouseAdminDialog
          open={isAppointAdminDialogOpen}
          onOpenChange={setIsAppointAdminDialogOpen}
          warehouseId={warehouse.id}
          warehouseName={warehouse.name}
          currentAdminId={warehouse.warehouse_admin_id}
          onSuccess={handleAdminAppointed}
        />
      )}

      {/* Rack Inventory Modal */}
      {selectedRack && (
        <RackInventoryModal
          open={isRackModalOpen}
          onOpenChange={setIsRackModalOpen}
          rackId={selectedRack.id}
          rackName={selectedRack.rack_name || `Rack ${selectedRack.rack_number}`}
          floorName={selectedRack.floorName}
          laneName={selectedRack.laneName}
          warehouseId={warehouse.id}
          warehouseStructure={warehouse}
          onInventoryAdded={handleRackInventoryAdded}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ display: isDeleteDialogOpen ? 'flex' : 'none' }}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Delete Warehouse</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{warehouse?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={cancelDeleteWarehouse}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteWarehouse} disabled={operationsLoading}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetails; 
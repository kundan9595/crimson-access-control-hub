import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { SkuInventoryLocation, AddInventoryRequest } from '@/services/inventory/types';
import { warehouseServiceOptimized } from '@/services/warehouseServiceOptimized';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MoveInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuId: string;
  skuCode: string;
  onSuccess: () => void;
}

const MoveInventoryDialog: React.FC<MoveInventoryDialogProps> = ({
  open,
  onOpenChange,
  skuId,
  skuCode,
  onSuccess
}) => {
  const [sourceLocations, setSourceLocations] = useState<SkuInventoryLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouseStructures, setWarehouseStructures] = useState<Map<string, any>>(new Map());
  
  // Source selection
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceFloorId, setSourceFloorId] = useState('');
  const [sourceLaneId, setSourceLaneId] = useState('');
  const [sourceRackId, setSourceRackId] = useState('');
  const [sourceQuantity, setSourceQuantity] = useState(0);
  const [maxSourceQuantity, setMaxSourceQuantity] = useState(0);

  // Destination selection
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [destinationFloorId, setDestinationFloorId] = useState('');
  const [destinationLaneId, setDestinationLaneId] = useState('');
  const [destinationRackId, setDestinationRackId] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchSourceLocations();
      fetchWarehouses();
      resetForm();
    }
  }, [open, skuId]);

  // Update max quantity when source location changes
  useEffect(() => {
    if (sourceWarehouseId && sourceFloorId && sourceLaneId && sourceRackId) {
      const location = sourceLocations.find(loc =>
        loc.warehouse_id === sourceWarehouseId &&
        loc.floor_id === sourceFloorId &&
        loc.lane_id === sourceLaneId &&
        loc.rack_id === sourceRackId
      );
      if (location) {
        setMaxSourceQuantity(location.quantity);
        setSourceQuantity(Math.min(sourceQuantity, location.quantity));
      } else {
        setMaxSourceQuantity(0);
        setSourceQuantity(0);
      }
    }
  }, [sourceWarehouseId, sourceFloorId, sourceLaneId, sourceRackId, sourceLocations]);

  // Fetch warehouse structure when destination warehouse changes
  useEffect(() => {
    if (destinationWarehouseId && !warehouseStructures.has(destinationWarehouseId)) {
      fetchWarehouseStructure(destinationWarehouseId);
    }
  }, [destinationWarehouseId]);

  const fetchSourceLocations = async () => {
    try {
      setLoading(true);
      const locations = await inventoryService.getSkuInventoryLocations(skuId);
      setSourceLocations(locations);
    } catch (error) {
      console.error('Error fetching source locations:', error);
      toast.error('Failed to load inventory locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const warehousesList = await inventoryService.getWarehouses();
      setWarehouses(warehousesList);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    }
  };

  const fetchWarehouseStructure = async (warehouseId: string) => {
    try {
      const structure = await warehouseServiceOptimized.getWarehouseById(warehouseId);
      if (structure) {
        setWarehouseStructures(prev => new Map(prev).set(warehouseId, structure));
      }
    } catch (error) {
      console.error('Error fetching warehouse structure:', error);
      toast.error('Failed to load warehouse structure');
    }
  };

  const resetForm = () => {
    setSourceWarehouseId('');
    setSourceFloorId('');
    setSourceLaneId('');
    setSourceRackId('');
    setSourceQuantity(0);
    setMaxSourceQuantity(0);
    setDestinationWarehouseId('');
    setDestinationFloorId('');
    setDestinationLaneId('');
    setDestinationRackId('');
  };

  // Get available source warehouses (only those with inventory)
  const getSourceWarehouses = () => {
    const warehouseIds = new Set(sourceLocations.map(loc => loc.warehouse_id));
    return warehouses.filter(w => warehouseIds.has(w.id));
  };

  // Get available source floors for selected warehouse
  const getSourceFloors = () => {
    const floorIds = new Set(
      sourceLocations
        .filter(loc => loc.warehouse_id === sourceWarehouseId)
        .map(loc => loc.floor_id)
    );
    return sourceLocations
      .filter(loc => loc.warehouse_id === sourceWarehouseId && floorIds.has(loc.floor_id))
      .map(loc => ({
        id: loc.floor_id,
        name: loc.floor_name,
        floor_number: loc.floor_number
      }))
      .filter((floor, index, self) => 
        index === self.findIndex(f => f.id === floor.id)
      );
  };

  // Get available source lanes for selected floor
  const getSourceLanes = () => {
    return sourceLocations
      .filter(loc => 
        loc.warehouse_id === sourceWarehouseId &&
        loc.floor_id === sourceFloorId
      )
      .map(loc => ({
        id: loc.lane_id,
        name: loc.lane_name,
        lane_number: loc.lane_number
      }))
      .filter((lane, index, self) => 
        index === self.findIndex(l => l.id === lane.id)
      );
  };

  // Get available source racks for selected lane
  const getSourceRacks = () => {
    return sourceLocations
      .filter(loc => 
        loc.warehouse_id === sourceWarehouseId &&
        loc.floor_id === sourceFloorId &&
        loc.lane_id === sourceLaneId
      )
      .map(loc => ({
        id: loc.rack_id,
        name: loc.rack_name,
        rack_number: loc.rack_number,
        side: loc.rack_side
      }))
      .filter((rack, index, self) => 
        index === self.findIndex(r => r.id === rack.id)
      );
  };

  // Get available floors for destination warehouse
  const getDestinationFloors = () => {
    const structure = warehouseStructures.get(destinationWarehouseId);
    return structure?.floors || [];
  };

  // Get available lanes for destination floor
  const getDestinationLanes = (floorId: string) => {
    const structure = warehouseStructures.get(destinationWarehouseId);
    const floor = structure?.floors?.find((f: any) => f.id === floorId);
    return floor?.lanes || [];
  };

  // Get available racks for destination lane
  const getDestinationRacks = (floorId: string, laneId: string) => {
    const lanes = getDestinationLanes(floorId);
    const lane = lanes.find((l: any) => l.id === laneId);
    return lane?.racks || [];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!sourceWarehouseId || !sourceFloorId || !sourceLaneId || !sourceRackId) {
      toast.error('Please select source location');
      return;
    }

    if (!destinationWarehouseId || !destinationFloorId || !destinationLaneId || !destinationRackId) {
      toast.error('Please select destination location');
      return;
    }

    if (sourceQuantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (sourceQuantity > maxSourceQuantity) {
      toast.error('Quantity cannot exceed available quantity');
      return;
    }

    // Check if source and destination are the same
    if (
      sourceWarehouseId === destinationWarehouseId &&
      sourceFloorId === destinationFloorId &&
      sourceLaneId === destinationLaneId &&
      sourceRackId === destinationRackId
    ) {
      toast.error('Source and destination cannot be the same location');
      return;
    }

    try {
      setSubmitting(true);

      // Find source location
      const sourceLocation = sourceLocations.find(loc =>
        loc.warehouse_id === sourceWarehouseId &&
        loc.floor_id === sourceFloorId &&
        loc.lane_id === sourceLaneId &&
        loc.rack_id === sourceRackId
      );

      if (!sourceLocation) {
        toast.error('Source location not found');
        return;
      }

      // Remove from source
      if (sourceQuantity === sourceLocation.quantity) {
        // Delete entire location entry
        const { error: deleteError } = await supabase
          .from('warehouse_inventory_locations')
          .delete()
          .eq('id', sourceLocation.location_id);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        // Update source location with reduced quantity
        const newQuantity = sourceLocation.quantity - sourceQuantity;
        const { error: updateError } = await supabase
          .from('warehouse_inventory_locations')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', sourceLocation.location_id);

        if (updateError) {
          throw updateError;
        }
      }

      // Add to destination
      const addRequest: AddInventoryRequest = {
        warehouse_id: destinationWarehouseId,
        sku_id: skuId,
        locations: [{
          floor_id: destinationFloorId,
          lane_id: destinationLaneId,
          rack_id: destinationRackId,
          quantity: sourceQuantity
        }]
      };

      await inventoryService.addInventory(addRequest);

      toast.success(`Moved ${sourceQuantity} units successfully`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error moving inventory:', error);
      if (error instanceof Error) {
        toast.error(`Failed to move inventory: ${error.message}`);
      } else {
        toast.error('Failed to move inventory');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move Inventory - {skuCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU Info */}
          <Card>
            <CardContent className="p-4">
              <div className="font-medium text-lg">{skuCode}</div>
              <div className="text-sm text-gray-600">Move inventory between warehouses and locations</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Section */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Source Location</h3>
                
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={sourceWarehouseId}
                    onValueChange={(value) => {
                      setSourceWarehouseId(value);
                      setSourceFloorId('');
                      setSourceLaneId('');
                      setSourceRackId('');
                      setSourceQuantity(0);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceWarehouses().map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Select
                    value={sourceFloorId}
                    onValueChange={(value) => {
                      setSourceFloorId(value);
                      setSourceLaneId('');
                      setSourceRackId('');
                      setSourceQuantity(0);
                    }}
                    disabled={!sourceWarehouseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceFloors().map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          Floor {floor.floor_number}: {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lane</Label>
                  <Select
                    value={sourceLaneId}
                    onValueChange={(value) => {
                      setSourceLaneId(value);
                      setSourceRackId('');
                      setSourceQuantity(0);
                    }}
                    disabled={!sourceFloorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lane" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceLanes().map((lane) => (
                        <SelectItem key={lane.id} value={lane.id}>
                          Lane {lane.lane_number}: {lane.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rack</Label>
                  <Select
                    value={sourceRackId}
                    onValueChange={(value) => {
                      setSourceRackId(value);
                      setSourceQuantity(0);
                    }}
                    disabled={!sourceLaneId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rack" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceRacks().map((rack) => (
                        <SelectItem key={rack.id} value={rack.id}>
                          {rack.name} ({rack.side})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity to Move</Label>
                  <Input
                    type="number"
                    min="1"
                    max={maxSourceQuantity}
                    value={sourceQuantity}
                    onChange={(e) => setSourceQuantity(parseInt(e.target.value) || 0)}
                    disabled={!sourceRackId}
                  />
                  <div className="text-xs text-gray-500">
                    Available: {maxSourceQuantity}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destination Section */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">Destination Location</h3>
                
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={destinationWarehouseId}
                    onValueChange={(value) => {
                      setDestinationWarehouseId(value);
                      setDestinationFloorId('');
                      setDestinationLaneId('');
                      setDestinationRackId('');
                      if (value && !warehouseStructures.has(value)) {
                        fetchWarehouseStructure(value);
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Select
                    value={destinationFloorId}
                    onValueChange={(value) => {
                      setDestinationFloorId(value);
                      setDestinationLaneId('');
                      setDestinationRackId('');
                    }}
                    disabled={!destinationWarehouseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDestinationFloors().map((floor: any) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          Floor {floor.floor_number}: {floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lane</Label>
                  <Select
                    value={destinationLaneId}
                    onValueChange={(value) => {
                      setDestinationLaneId(value);
                      setDestinationRackId('');
                    }}
                    disabled={!destinationFloorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lane" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDestinationLanes(destinationFloorId).map((lane: any) => (
                        <SelectItem key={lane.id} value={lane.id}>
                          Lane {lane.lane_number}: {lane.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rack</Label>
                  <Select
                    value={destinationRackId}
                    onValueChange={setDestinationRackId}
                    disabled={!destinationLaneId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rack" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDestinationRacks(destinationFloorId, destinationLaneId).map((rack: any) => (
                        <SelectItem key={rack.id} value={rack.id}>
                          {rack.rack_name || `Rack ${rack.rack_number}`} ({rack.side})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !sourceRackId || !destinationRackId || sourceQuantity <= 0}
            >
              {submitting ? 'Moving...' : 'Move Inventory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoveInventoryDialog;


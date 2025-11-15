import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { AddInventoryRequest, InventoryLocationInput } from '@/services/inventory/types';
import { warehouseServiceOptimized } from '@/services/warehouseServiceOptimized';
import { toast } from 'sonner';

interface GlobalAddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuId: string;
  skuCode: string;
  onSuccess: () => void;
}

interface LocationEntry extends InventoryLocationInput {
  warehouse_id: string;
}

const GlobalAddInventoryDialog: React.FC<GlobalAddInventoryDialogProps> = ({
  open,
  onOpenChange,
  skuId,
  skuCode,
  onSuccess
}) => {
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouseStructures, setWarehouseStructures] = useState<Map<string, any>>(new Map());
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  // Fetch warehouses on open
  useEffect(() => {
    if (open) {
      fetchWarehouses();
      setLocations([]);
    }
  }, [open]);

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const warehousesList = await inventoryService.getWarehouses();
      setWarehouses(warehousesList);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Fetch warehouse structure when warehouse is selected
  const fetchWarehouseStructure = async (warehouseId: string) => {
    if (warehouseStructures.has(warehouseId)) {
      return; // Already cached
    }

    try {
      const structure = await warehouseServiceOptimized.getWarehouseById(warehouseId);
      if (structure) {
        setWarehouseStructures(prev => new Map(prev).set(warehouseId, structure));
      }
    } catch (error) {
      console.error('Error fetching warehouse structure:', error);
      toast.error(`Failed to load structure for warehouse`);
    }
  };

  // Add location
  const addLocation = () => {
    setLocations(prev => [...prev, {
      warehouse_id: '',
      floor_id: '',
      lane_id: '',
      rack_id: '',
      quantity: 0
    }]);
  };

  // Remove location
  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  // Update location
  const updateLocation = (index: number, field: keyof LocationEntry, value: string | number) => {
    setLocations(prev => prev.map((location, i) => {
      if (i === index) {
        const updated = { ...location, [field]: value };
        // Reset dependent fields when warehouse changes
        if (field === 'warehouse_id') {
          updated.floor_id = '';
          updated.lane_id = '';
          updated.rack_id = '';
          // Fetch warehouse structure
          if (value) {
            fetchWarehouseStructure(value as string);
          }
        }
        // Reset dependent fields when floor changes
        if (field === 'floor_id') {
          updated.lane_id = '';
          updated.rack_id = '';
        }
        // Reset dependent fields when lane changes
        if (field === 'lane_id') {
          updated.rack_id = '';
        }
        return updated;
      }
      return location;
    }));
  };

  // Get available floors for a warehouse
  const getFloors = (warehouseId: string) => {
    const structure = warehouseStructures.get(warehouseId);
    return structure?.floors || [];
  };

  // Get available lanes for a floor
  const getLanes = (warehouseId: string, floorId: string) => {
    const structure = warehouseStructures.get(warehouseId);
    const floor = structure?.floors?.find((f: any) => f.id === floorId);
    return floor?.lanes || [];
  };

  // Get available racks for a lane
  const getRacks = (warehouseId: string, floorId: string, laneId: string) => {
    const lanes = getLanes(warehouseId, floorId);
    const lane = lanes.find((l: any) => l.id === laneId);
    return lane?.racks || [];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (locations.length === 0) {
      toast.error('Please add at least one location');
      return;
    }

    // Validate locations
    const validLocations = locations.filter(loc => 
      loc.warehouse_id && loc.floor_id && loc.lane_id && loc.rack_id && loc.quantity > 0
    );

    if (validLocations.length === 0) {
      toast.error('Please fill in all location details and ensure quantities are greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      // Group locations by warehouse
      const locationsByWarehouse = new Map<string, InventoryLocationInput[]>();
      validLocations.forEach(loc => {
        const existing = locationsByWarehouse.get(loc.warehouse_id) || [];
        existing.push({
          floor_id: loc.floor_id,
          lane_id: loc.lane_id,
          rack_id: loc.rack_id,
          quantity: loc.quantity
        });
        locationsByWarehouse.set(loc.warehouse_id, existing);
      });

      // Add inventory to each warehouse
      const promises = Array.from(locationsByWarehouse.entries()).map(([warehouseId, locs]) => {
        const request: AddInventoryRequest = {
          warehouse_id: warehouseId,
          sku_id: skuId,
          locations: locs
        };
        return inventoryService.addInventory(request);
      });

      await Promise.all(promises);
      
      toast.success(`Inventory added successfully to ${locationsByWarehouse.size} warehouse(s)`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding inventory:', error);
      if (error instanceof Error) {
        toast.error(`Failed to add inventory: ${error.message}`);
      } else {
        toast.error('Failed to add inventory');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setLocations([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory - {skuCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU Info */}
          <Card>
            <CardContent className="p-4">
              <div className="font-medium text-lg">{skuCode}</div>
              <div className="text-sm text-gray-600">Add inventory across multiple warehouses</div>
            </CardContent>
          </Card>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Storage Locations</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </div>

            {locations.map((location, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Location {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Warehouse Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`warehouse-${index}`}>Warehouse</Label>
                      <Select
                        value={location.warehouse_id}
                        onValueChange={(value) => updateLocation(index, 'warehouse_id', value)}
                        disabled={loadingWarehouses}
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

                    {/* Floor Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`floor-${index}`}>Floor</Label>
                      <Select
                        value={location.floor_id}
                        onValueChange={(value) => updateLocation(index, 'floor_id', value)}
                        disabled={!location.warehouse_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFloors(location.warehouse_id).map((floor: any) => (
                            <SelectItem key={floor.id} value={floor.id}>
                              Floor {floor.floor_number}: {floor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lane Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`lane-${index}`}>Lane</Label>
                      <Select
                        value={location.lane_id}
                        onValueChange={(value) => updateLocation(index, 'lane_id', value)}
                        disabled={!location.floor_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select lane" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLanes(location.warehouse_id, location.floor_id).map((lane: any) => (
                            <SelectItem key={lane.id} value={lane.id}>
                              Lane {lane.lane_number}: {lane.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rack Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`rack-${index}`}>Rack</Label>
                      <Select
                        value={location.rack_id}
                        onValueChange={(value) => updateLocation(index, 'rack_id', value)}
                        disabled={!location.lane_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rack" />
                        </SelectTrigger>
                        <SelectContent>
                          {getRacks(location.warehouse_id, location.floor_id, location.lane_id).map((rack: any) => (
                            <SelectItem key={rack.id} value={rack.id}>
                              {rack.rack_name || `Rack ${rack.rack_number}`} ({rack.side})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={location.quantity}
                        onChange={(e) => updateLocation(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || locations.length === 0}>
              {submitting ? 'Adding...' : 'Add Inventory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalAddInventoryDialog;


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Search } from 'lucide-react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { AddInventoryRequest, InventoryLocationInput } from '@/services/inventory/types';
import { toast } from 'sonner';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseStructure: any; // Warehouse with floors, lanes, racks
  onSuccess: () => void;
  preSelectedRackId?: string; // Optional: pre-select a specific rack
}

interface SkuOption {
  id: string;
  sku_code: string;
  class?: {
    style?: {
      brand?: {
        name: string;
      };
      name: string;
    };
    color?: {
      name: string;
    };
    size?: {
      name: string;
    };
  };
  size?: {
    name: string;
  };
}

const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  warehouseStructure,
  onSuccess,
  preSelectedRackId
}) => {
  const [selectedSku, setSelectedSku] = useState<SkuOption | null>(null);
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [skuOptions, setSkuOptions] = useState<SkuOption[]>([]);
  const [searchingSkus, setSearchingSkus] = useState(false);
  const [locations, setLocations] = useState<InventoryLocationInput[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Pre-populate with selected rack if provided
  useEffect(() => {
    if (open && preSelectedRackId && warehouseStructure) {
      // Find the rack details from warehouse structure
      let selectedFloorId = '';
      let selectedLaneId = '';
      
      for (const floor of warehouseStructure.floors || []) {
        for (const lane of floor.lanes || []) {
          for (const rack of lane.racks || []) {
            if (rack.id === preSelectedRackId) {
              selectedFloorId = floor.id;
              selectedLaneId = lane.id;
              break;
            }
          }
          if (selectedLaneId) break;
        }
        if (selectedFloorId) break;
      }

      if (selectedFloorId && selectedLaneId) {
        setLocations([{
          floor_id: selectedFloorId,
          lane_id: selectedLaneId,
          rack_id: preSelectedRackId,
          quantity: 0
        }]);
      }
    } else if (open && !preSelectedRackId) {
      // Reset locations when opening without pre-selection
      setLocations([]);
    }
  }, [open, preSelectedRackId, warehouseStructure]);

  // Search SKUs
  const searchSkus = async (query: string) => {
    if (!query.trim()) {
      setSkuOptions([]);
      return;
    }

    try {
      setSearchingSkus(true);
      console.log('Searching SKUs with query:', query);
      const results = await inventoryService.searchSkus(query, 10);
      console.log('SKU search results:', results);
      setSkuOptions(results);
    } catch (error) {
      console.error('Error searching SKUs:', error);
      // More specific error message
      if (error instanceof Error) {
        toast.error(`Failed to search SKUs: ${error.message}`);
      } else {
        toast.error('Failed to search SKUs. Please try again.');
      }
    } finally {
      setSearchingSkus(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSkus(skuSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [skuSearchQuery]);

  // Add location
  const addLocation = () => {
    setLocations(prev => [...prev, {
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
  const updateLocation = (index: number, field: keyof InventoryLocationInput, value: string | number) => {
    setLocations(prev => prev.map((location, i) => 
      i === index ? { ...location, [field]: value } : location
    ));
  };

  // Get available floors
  const getFloors = () => {
    return warehouseStructure?.floors || [];
  };

  // Get available lanes for a floor
  const getLanes = (floorId: string) => {
    const floor = getFloors().find((f: any) => f.id === floorId);
    return floor?.lanes || [];
  };

  // Get available racks for a lane
  const getRacks = (floorId: string, laneId: string) => {
    const lanes = getLanes(floorId);
    const lane = lanes.find((l: any) => l.id === laneId);
    return lane?.racks || [];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSku) {
      toast.error('Please select a SKU');
      return;
    }

    if (locations.length === 0) {
      toast.error('Please add at least one location');
      return;
    }

    // Validate locations
    const validLocations = locations.filter(loc => 
      loc.floor_id && loc.lane_id && loc.rack_id && loc.quantity > 0
    );

    if (validLocations.length === 0) {
      toast.error('Please fill in all location details and ensure quantities are greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      const request: AddInventoryRequest = {
        warehouse_id: warehouseId,
        sku_id: selectedSku.id,
        locations: validLocations
      };

      await inventoryService.addInventory(request);
      
      toast.success('Inventory added successfully');
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
    setSelectedSku(null);
    setSkuSearchQuery('');
    setSkuOptions([]);
    setLocations([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU Selection */}
          <div className="space-y-4">
            <Label htmlFor="sku-search">Select SKU</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="sku-search"
                placeholder="Search by SKU code, brand, or product name..."
                value={skuSearchQuery}
                onChange={(e) => setSkuSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* SKU Options */}
            {skuOptions.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {skuOptions.map((sku) => (
                  <div
                    key={sku.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedSku?.id === sku.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedSku(sku)}
                  >
                    <div className="flex items-center justify-between">
                                           <div>
                       <div className="font-medium">{sku.sku_code}</div>
                       <div className="text-sm text-gray-600">
                         {sku.class?.style?.brand?.name && sku.class?.style?.name 
                           ? `${sku.class.style.brand.name} - ${sku.class.style.name}`
                           : 'Product details not available'
                         }
                       </div>
                       <div className="text-xs text-gray-500">
                         {sku.class?.color?.name && (sku.class?.size?.name || sku.size?.name)
                           ? `${sku.class.color.name} | ${sku.class.size?.name || sku.size?.name}`
                           : 'Size/Color not available'
                         }
                       </div>
                     </div>
                      {selectedSku?.id === sku.id && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected SKU Display */}
            {selectedSku && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                                       <div>
                     <div className="font-medium">{selectedSku.sku_code}</div>
                     <div className="text-sm text-gray-600">
                       {selectedSku.class?.style?.brand?.name && selectedSku.class?.style?.name 
                         ? `${selectedSku.class.style.brand.name} - ${selectedSku.class.style.name}`
                         : 'Product details not available'
                       }
                     </div>
                     <div className="text-xs text-gray-500">
                       {selectedSku.class?.color?.name && (selectedSku.class?.size?.name || selectedSku.size?.name)
                         ? `${selectedSku.class.color.name} | ${selectedSku.class.size?.name || selectedSku.size?.name}`
                         : 'Size/Color not available'
                       }
                     </div>
                   </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSku(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Locations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Storage Locations</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
                disabled={!selectedSku}
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Floor Selection */}
                    <div className="space-y-2">
                      <Label htmlFor={`floor-${index}`}>Floor</Label>
                      <Select
                        value={location.floor_id}
                        onValueChange={(value) => updateLocation(index, 'floor_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {getFloors().map((floor: any) => (
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
                          {getLanes(location.floor_id).map((lane: any) => (
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
                          {getRacks(location.floor_id, location.lane_id).map((rack: any) => (
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
            <Button type="submit" disabled={submitting || !selectedSku || locations.length === 0}>
              {submitting ? 'Adding...' : 'Add Inventory'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryDialog; 
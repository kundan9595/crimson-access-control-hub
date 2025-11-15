import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { inventoryService } from '@/services/inventory/inventoryService';
import { SkuInventoryLocation } from '@/services/inventory/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RemoveInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuId: string;
  skuCode: string;
  onSuccess: () => void;
}

interface LocationWithSelection extends SkuInventoryLocation {
  selected: boolean;
  quantityToRemove: number;
}

const RemoveInventoryDialog: React.FC<RemoveInventoryDialogProps> = ({
  open,
  onOpenChange,
  skuId,
  skuCode,
  onSuccess
}) => {
  const [locations, setLocations] = useState<LocationWithSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch locations when dialog opens
  useEffect(() => {
    if (open) {
      fetchLocations();
    } else {
      setLocations([]);
    }
  }, [open, skuId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const locationsData = await inventoryService.getSkuInventoryLocations(skuId);
      setLocations(locationsData.map(loc => ({
        ...loc,
        selected: false,
        quantityToRemove: 0
      })));
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load inventory locations');
    } finally {
      setLoading(false);
    }
  };

  // Toggle location selection
  const toggleSelection = (index: number) => {
    setLocations(prev => prev.map((loc, i) => 
      i === index 
        ? { ...loc, selected: !loc.selected, quantityToRemove: !loc.selected ? loc.quantity : 0 }
        : loc
    ));
  };

  // Update quantity to remove
  const updateQuantityToRemove = (index: number, quantity: number) => {
    setLocations(prev => prev.map((loc, i) => 
      i === index 
        ? { ...loc, quantityToRemove: Math.max(0, Math.min(quantity, loc.quantity)) }
        : loc
    ));
  };

  // Select all locations
  const selectAll = () => {
    setLocations(prev => prev.map(loc => ({
      ...loc,
      selected: true,
      quantityToRemove: loc.quantity
    })));
  };

  // Deselect all locations
  const deselectAll = () => {
    setLocations(prev => prev.map(loc => ({
      ...loc,
      selected: false,
      quantityToRemove: 0
    })));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedLocations = locations.filter(loc => loc.selected && loc.quantityToRemove > 0);

    if (selectedLocations.length === 0) {
      toast.error('Please select at least one location and specify quantity to remove');
      return;
    }

    // Validate quantities
    const invalidLocations = selectedLocations.filter(loc => loc.quantityToRemove > loc.quantity);
    if (invalidLocations.length > 0) {
      toast.error('Quantity to remove cannot exceed current quantity');
      return;
    }

    try {
      setSubmitting(true);

      // Process each selected location
      const promises = selectedLocations.map(async (loc) => {
        if (loc.quantityToRemove === loc.quantity) {
          // Delete entire location entry
          const { error } = await supabase
            .from('warehouse_inventory_locations')
            .delete()
            .eq('id', loc.location_id);

          if (error) {
            throw error;
          }
        } else {
          // Update location with reduced quantity
          const newQuantity = loc.quantity - loc.quantityToRemove;
          const { error } = await supabase
            .from('warehouse_inventory_locations')
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', loc.location_id);

          if (error) {
            throw error;
          }
        }
      });

      await Promise.all(promises);
      
      toast.success(`Removed inventory from ${selectedLocations.length} location(s)`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error removing inventory:', error);
      if (error instanceof Error) {
        toast.error(`Failed to remove inventory: ${error.message}`);
      } else {
        toast.error('Failed to remove inventory');
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

  const selectedCount = locations.filter(loc => loc.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remove Inventory - {skuCode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SKU Info */}
          <Card>
            <CardContent className="p-4">
              <div className="font-medium text-lg">{skuCode}</div>
              <div className="text-sm text-gray-600">Select locations and specify quantities to remove</div>
            </CardContent>
          </Card>

          {/* Selection Controls */}
          {locations.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedCount} of {locations.length} location(s) selected
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* Locations List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : locations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No inventory locations found for this SKU
                </CardContent>
              </Card>
            ) : (
              locations.map((location, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={location.selected}
                        onCheckedChange={() => toggleSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Warehouse</Label>
                          <div className="font-medium">{location.warehouse_name}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Floor</Label>
                          <div className="font-medium">Floor {location.floor_number}: {location.floor_name}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Lane</Label>
                          <div className="font-medium">Lane {location.lane_number}: {location.lane_name}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Rack</Label>
                          <div className="font-medium">{location.rack_name} ({location.rack_side})</div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Current Quantity</Label>
                          <div className="font-medium">{location.quantity}</div>
                        </div>
                      </div>
                      {location.selected && (
                        <div className="w-32">
                          <Label htmlFor={`remove-qty-${index}`} className="text-xs">Quantity to Remove</Label>
                          <Input
                            id={`remove-qty-${index}`}
                            type="number"
                            min="1"
                            max={location.quantity}
                            value={location.quantityToRemove}
                            onChange={(e) => updateQuantityToRemove(index, parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {location.quantity}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || selectedCount === 0}
              variant="destructive"
            >
              {submitting ? 'Removing...' : `Remove from ${selectedCount} Location(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveInventoryDialog;


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WarehouseInventory, WarehouseInventoryLocation } from '@/services/inventory/types';
import { inventoryService } from '@/services/inventory/inventoryService';

interface InventoryLocationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: WarehouseInventory | null;
  showWarehouseColumn?: boolean;
}

const InventoryLocationsModal: React.FC<InventoryLocationsModalProps> = ({
  open,
  onOpenChange,
  inventory,
  showWarehouseColumn = false
}) => {
  const [locations, setLocations] = useState<WarehouseInventoryLocation[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch locations when modal opens
  useEffect(() => {
    if (open && inventory?.id) {
      setLoading(true);
      inventoryService.getInventoryLocations(inventory.id)
        .then(setLocations)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, inventory?.id]);

  if (!inventory || !inventory.sku) {
    return null;
  }

  const sku = inventory.sku;

  const getLocationCode = (location: any) => {
    const floor = location.floor;
    const lane = location.lane;
    const rack = location.rack;
    
    if (!floor || !lane || !rack) return 'Unknown Location';
    
    return `${floor.name || `F${floor.floor_number}`}-${lane.name || `L${lane.lane_number}`}-${rack.rack_name || `R${rack.rack_number}`} (${rack.side})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Locations for {sku.class?.style?.brand?.name} {sku.class?.style?.name} {sku.class?.color?.name} {sku.class?.size?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* SKU Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">{sku.sku_code}</h3>
                <p className="text-sm text-gray-600">
                  {sku.class?.style?.brand?.name} - {sku.class?.style?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {sku.class?.color?.name} | {sku.class?.size?.name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  Total: {inventory.total_quantity} units
                </div>
                <div className="text-sm text-gray-600">
                  Available: {inventory.available_quantity} units
                </div>
                {inventory.reserved_quantity > 0 && (
                  <div className="text-sm text-orange-600">
                    Reserved: {inventory.reserved_quantity} units
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Locations Table */}
          {loading ? (
            <div>
              <h4 className="font-medium mb-3">Storage Locations</h4>
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading locations...</p>
              </div>
            </div>
          ) : locations.length > 0 ? (
            <div>
              <h4 className="font-medium mb-3">Storage Locations</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    {showWarehouseColumn && <TableHead>Warehouse</TableHead>}
                    <TableHead>Location Code</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      {showWarehouseColumn && (
                        <TableCell className="font-medium">
                          {inventory.warehouse?.name || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {getLocationCode(location)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {location.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No locations configured for this inventory item.</p>
            </div>
          )}

          {/* Reservations Summary */}
          {inventory.reservations && inventory.reservations.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Active Reservations</h4>
              <div className="space-y-2">
                {inventory.reservations
                  .filter(reservation => reservation.status === 'active')
                  .map((reservation) => (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">
                          {reservation.reservation_type === 'order' ? 'Order' : 'Manual'} Reservation
                        </div>
                        {reservation.order_id && (
                          <div className="text-xs text-gray-600">Order: {reservation.order_id}</div>
                        )}
                        {reservation.notes && (
                          <div className="text-xs text-gray-600">{reservation.notes}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {reservation.quantity} units
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryLocationsModal; 
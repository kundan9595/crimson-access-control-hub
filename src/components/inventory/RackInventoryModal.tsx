import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, X, AlertTriangle, Plus } from 'lucide-react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { WarehouseInventory } from '@/services/inventory/types';
import { toast } from 'sonner';
import AddInventoryDialog from './AddInventoryDialog';

interface RackInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rackId: string;
  rackName: string;
  floorName: string;
  laneName: string;
  warehouseId: string;
  warehouseStructure: any;
  onInventoryAdded?: () => void; // Optional callback when inventory is added
}

const RackInventoryModal: React.FC<RackInventoryModalProps> = ({
  open,
  onOpenChange,
  rackId,
  rackName,
  floorName,
  laneName,
  warehouseId,
  warehouseStructure,
  onInventoryAdded
}) => {
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (open && rackId) {
      fetchRackInventory();
    }
  }, [open, rackId]);

  const fetchRackInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getInventoryByRack(rackId);
      setInventory(data);
    } catch (err) {
      console.error('Error fetching rack inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rack inventory');
      toast.error('Failed to load rack inventory');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'bg-red-100 text-red-800';
    if (availableQuantity <= totalQuantity * 0.1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (availableQuantity: number, totalQuantity: number) => {
    if (availableQuantity === 0) return 'Out of Stock';
    if (availableQuantity <= totalQuantity * 0.1) return 'Low Stock';
    return 'In Stock';
  };

  const handleAddSuccess = async () => {
    // Refresh the inventory data
    await fetchRackInventory();
    toast.success('Inventory added successfully');
    
    // Notify parent component that inventory was added
    if (onInventoryAdded) {
      onInventoryAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Rack Inventory: {rackName}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Floor: {floorName} | Lane: {laneName}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="text-center space-y-4 py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Error Loading Inventory</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchRackInventory}>
              Try Again
            </Button>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center space-y-4 py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">No Inventory</h3>
            <p className="text-gray-600">This rack currently has no inventory items.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {inventory.length} item{inventory.length !== 1 ? 's' : ''}
              </Badge>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Inventory
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Quantity in Rack</TableHead>
                  <TableHead className="text-right">Total Available</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const rackLocation = item.locations?.find(loc => loc.rack_id === rackId);
                  const quantity = rackLocation?.quantity || 0;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.sku?.sku_code || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.sku?.class?.style?.name || 'Product name not available'}
                      </TableCell>
                      <TableCell>
                        {item.sku?.class?.style?.brand?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.sku?.class?.color?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.sku?.size?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.available_quantity || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.reserved_quantity === 0 ? (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            0
                          </Badge>
                        ) : (
                          <span className="font-medium">{item.reserved_quantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(item.available_quantity || 0, item.total_quantity || 0)}>
                          {getStockStatusText(item.available_quantity || 0, item.total_quantity || 0)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Inventory Dialog */}
        <AddInventoryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          warehouseId={warehouseId}
          warehouseStructure={warehouseStructure}
          onSuccess={handleAddSuccess}
          preSelectedRackId={rackId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RackInventoryModal; 
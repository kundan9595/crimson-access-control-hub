import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import CreateWarehouseDialog from './dialogs/CreateWarehouseDialog';
import { toast } from 'sonner';
import { type CreateWarehouseData } from '@/services/warehouseServiceOptimized';

interface EditWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: any;
  onSave: (warehouseData: CreateWarehouseData) => Promise<void>;
}

const EditWarehouseDialog: React.FC<EditWarehouseDialogProps> = ({
  open,
  onOpenChange,
  warehouse,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the transformed data to prevent unnecessary re-computations
  const transformedData = useMemo(() => {
    if (!warehouse || !open) return null;

    try {
      // Transform warehouse data back to the format expected by CreateWarehouseDialog
      const data = {
        warehouse: {
          name: warehouse.name || '',
          description: warehouse.description || '',
          city: warehouse.city || '',
          state: warehouse.state || '',
          postal_code: warehouse.postal_code || '',
          address: warehouse.address || '',
          status: warehouse.status || 'active'
        },
        floors: (warehouse.floors || []).map((floor: any) => ({
          id: floor.id,
          name: floor.name || `Floor ${floor.floor_number}`,
          floor_number: floor.floor_number || 1
        })),
        lanes: (warehouse.floors || []).flatMap((floor: any) => 
          (floor.lanes || []).map((lane: any) => {
            // Get rack configuration from the lane config or use defaults
            const config = lane.config || {};
            const racks = lane.racks || [];
            
            // Separate left and right racks and ensure they respect enablement settings
            const leftRacks = racks
              .filter((rack: any) => rack.side === 'left')
              .map((rack: any) => ({
                id: rack.id,
                side: 'left' as const,
                rack_name: rack.rack_name || 'A',
                rack_number: rack.rack_number || 1
              }));
            
            const rightRacks = racks
              .filter((rack: any) => rack.side === 'right')
              .map((rack: any) => ({
                id: rack.id,
                side: 'right' as const,
                rack_name: rack.rack_name || 'A',
                rack_number: rack.rack_number || 1
              }));
            
            return {
              id: lane.id,
              name: lane.name || `Lane ${lane.lane_number}`,
              lane_number: lane.lane_number || 1,
              floor_number: floor.floor_number || 1,
              config: {
                left_side_enabled: config.left_side_enabled ?? true,
                right_side_enabled: config.right_side_enabled ?? true,
                default_direction: config.default_direction || 'left',
                default_left_racks: config.default_left_racks || 4,
                default_right_racks: config.default_right_racks || 4
              },
              racks: [...leftRacks, ...rightRacks]
            };
          })
        )
      };

      return data;
    } catch (error) {
      console.error('Error transforming warehouse data:', error);
      toast.error('Failed to load warehouse data for editing');
      return null;
    }
  }, [warehouse, open]);

  // Set loading state when modal opens
  useEffect(() => {
    if (open && warehouse) {
      setIsLoading(true);
      // Use a small delay to ensure smooth transition and prevent glitch
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, warehouse]);

  const handleSave = async (warehouseData: any) => {
    try {
      await onSave(warehouseData);
      onOpenChange(false);
      toast.success('Warehouse updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update warehouse: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!warehouse) return null;

  return (
    <>
      {(!transformedData || isLoading) && open ? (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Edit Warehouse: {warehouse.name}
              </DialogTitle>
            </DialogHeader>

            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {isLoading ? 'Loading warehouse configuration...' : 'Preparing warehouse data...'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : transformedData && (
        <CreateWarehouseDialog
          open={open}
          onOpenChange={onOpenChange}
          onSave={handleSave}
          initialData={transformedData}
          isEditMode={true}
        />
      )}
    </>
  );
};

export default EditWarehouseDialog; 
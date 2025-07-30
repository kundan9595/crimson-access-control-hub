import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Save, X } from 'lucide-react';
import CreateWarehouseDialog from './CreateWarehouseDialog';
import { toast } from 'sonner';
import type { UpdateWarehouseData } from '@/services/warehouseService';

interface EditWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: any;
  onSave: (warehouseData: UpdateWarehouseData) => Promise<void>;
}

const EditWarehouseDialog: React.FC<EditWarehouseDialogProps> = ({
  open,
  onOpenChange,
  warehouse,
  onSave
}) => {
  const [initialData, setInitialData] = useState<any>(null);

  // Transform warehouse data when warehouse changes or modal opens
  useEffect(() => {
    if (warehouse && open) {
      console.log('Warehouse data for edit:', warehouse);
      
      // Transform warehouse data back to the format expected by CreateWarehouseDialog
      const transformedData = {
        warehouse: {
          name: warehouse.name,
          description: warehouse.description || '',
          city: warehouse.city || '',
          state: warehouse.state || '',
          country: warehouse.country || 'USA',
          postal_code: warehouse.postal_code || '',
          address: warehouse.address || '',
          status: warehouse.status || 'active'
        },
        floors: warehouse.floors?.map((floor: any, floorIndex: number) => ({
          name: floor.name,
          floor_number: floor.floor_number,
          description: floor.description
        })) || [],
        lanes: warehouse.floors?.flatMap((floor: any, floorIndex: number) => 
          floor.lanes?.map((lane: any, laneIndex: number) => ({
            name: lane.name,
            lane_number: lane.lane_number,
            floor_number: floor.floor_number,
            description: lane.description,
            config: {
              left_side_enabled: lane.config?.left_side_enabled ?? true,
              right_side_enabled: lane.config?.right_side_enabled ?? true,
              default_direction: lane.config?.default_direction || 'left',
              default_left_racks: lane.config?.default_left_racks || 4,
              default_right_racks: lane.config?.default_right_racks || 4
            },
            racks: lane.racks?.map((rack: any) => ({
              side: rack.side,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })) || []
          })) || []
        ) || []
      };

      console.log('Transformed data:', transformedData);
      setInitialData(transformedData);
    }
  }, [warehouse, open]);

  // Reset data when modal closes
  useEffect(() => {
    if (!open) {
      console.log('Dialog closed, resetting data');
      setInitialData(null);
    }
  }, [open]);

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
    console.log('Closing edit dialog');
    onOpenChange(false);
  };

  if (!warehouse) return null;

  return (
    <>
      {!initialData && open ? (
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
                Loading warehouse configuration...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      ) : initialData && (
        <CreateWarehouseDialog
          open={open}
          onOpenChange={onOpenChange}
          onSave={handleSave}
          initialData={initialData}
          isEditMode={true}
        />
      )}
    </>
  );
};

export default EditWarehouseDialog; 
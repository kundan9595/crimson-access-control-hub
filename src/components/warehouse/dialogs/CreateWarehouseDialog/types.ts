import { type WarehouseWithDetails } from '@/services/warehouseServiceOptimized';

export interface CreateWarehouseData {
  warehouse: {
    name: string;
    description?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    address?: string;
    status?: string;
  };
  floors: Array<{
    id?: string; // Optional for new items, required for existing items in edit mode
    name: string;
    floor_number: number;
    description?: string;
  }>;
  lanes: Array<{
    id?: string; // Optional for new items, required for existing items in edit mode
    name: string;
    lane_number: number;
    floor_number: number;
    description?: string;
    config: {
      left_side_enabled: boolean;
      right_side_enabled: boolean;
      default_direction: 'left' | 'right';
      default_left_racks: number;
      default_right_racks: number;
    };
    racks: Array<{
      id?: string; // Optional for new items, required for existing items in edit mode
      side: 'left' | 'right';
      rack_name: string;
      rack_number: number;
    }>;
  }>;
}

export interface Floor {
  id: string;
  name: string;
  floor_number: number;
}

export interface Lane {
  id: string;
  name: string;
  lane_number: number;
  floor_number: number;
  description?: string;
  default_direction: 'left' | 'right';
  rack_config: {
    left_side_enabled: boolean;
    right_side_enabled: boolean;
    left_racks: Array<{
      id: string;
      rack_name: string;
      rack_number: number;
    }>;
    right_racks: Array<{
      id: string;
      rack_name: string;
      rack_number: number;
    }>;
  };
}

export interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateWarehouseData) => Promise<void>;
  initialData?: WarehouseWithDetails | CreateWarehouseData;
  isEditMode?: boolean;
}

export type DialogStep = 'basic' | 'floors' | 'lanes' | 'review'; 
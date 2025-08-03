import { Sku } from '../masters/types';

export interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  sku_id: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  sku?: Sku;
  locations?: WarehouseInventoryLocation[];
  reservations?: WarehouseInventoryReservation[];
}

export interface WarehouseInventoryLocation {
  id: string;
  warehouse_inventory_id: string;
  floor_id: string;
  lane_id: string;
  rack_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  floor?: {
    id: string;
    floor_number: number;
    name: string;
  };
  lane?: {
    id: string;
    lane_number: number;
    name: string;
  };
  rack?: {
    id: string;
    rack_name: string;
    rack_number: number;
    side: 'left' | 'right';
  };
}

export interface WarehouseInventoryReservation {
  id: string;
  warehouse_inventory_id: string;
  order_id?: string;
  quantity: number;
  reservation_type: 'order' | 'manual' | 'damaged';
  status: 'active' | 'fulfilled' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface InventoryLocationInput {
  floor_id: string;
  lane_id: string;
  rack_id: string;
  quantity: number;
}

export interface AddInventoryRequest {
  warehouse_id: string;
  sku_id: string;
  locations: InventoryLocationInput[];
}

export interface UpdateInventoryRequest {
  warehouse_inventory_id: string;
  locations: InventoryLocationInput[];
}

export interface InventoryFilters {
  warehouse_id?: string;
  sku_code?: string;
  brand?: string;
  product_name?: string;
  min_quantity?: number;
  max_quantity?: number;
  has_stock?: boolean;
}

export interface InventorySearchParams {
  query?: string;
  filters?: InventoryFilters;
  page?: number;
  limit?: number;
}

export interface InventorySearchResult {
  inventory: WarehouseInventory[];
  total: number;
  hasMore: boolean;
}

export interface InventoryStatistics {
  total_items: number;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_items: number;
  out_of_stock_items: number;
} 
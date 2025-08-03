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
  warehouse?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  locations?: WarehouseInventoryLocation[];
  reservations?: WarehouseInventoryReservation[];
}

// New types for Class and Style inventory views
export interface ClassInventoryView {
  class_id: string;
  class_name: string;
  style_name: string;
  brand_name: string;
  color_name: string;
  size_group_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  sku_count: number;
  warehouse_count: number;
  locations_count: number;
}

export interface StyleInventoryView {
  style_id: string;
  style_name: string;
  brand_name: string;
  category_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  class_count: number;
  sku_count: number;
  warehouse_count: number;
  locations_count: number;
}

export interface ClassInventorySearchResult {
  inventory: ClassInventoryView[];
  total: number;
  hasMore: boolean;
}

export interface StyleInventorySearchResult {
  inventory: StyleInventoryView[];
  total: number;
  hasMore: boolean;
}

export interface ClassInventoryStatistics {
  total_classes: number;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  total_skus: number;
  total_warehouses: number;
}

export interface StyleInventoryStatistics {
  total_styles: number;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  total_classes: number;
  total_skus: number;
  total_warehouses: number;
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
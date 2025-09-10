import { Sku, Class } from '../masters/types';

export interface MaterialPlanningItem {
  id: string;
  sku_code: string;
  description?: string;
  class_id: string;
  
  // Related data
  class?: Class;
  size?: {
    id: string;
    name: string;
    code: string;
  };
  
  // Inventory data
  current_inventory: number;
  reserved_inventory: number;
  available_inventory: number;
  
  // Threshold data (calculated based on class configuration)
  min_threshold: number;
  optimal_threshold: number;
  
  // Status calculation
  status: 'Normal' | 'Low' | 'Critical' | 'Overstocked';
  status_percentage: number; // How close to min threshold (0-100%)
  
  // Threshold source info
  threshold_source: 'overall' | 'monthly';
  current_month?: number;
  
  // Additional metadata
  auto_reorder_enabled: boolean;
  preferred_vendor_id?: string;
  preferred_vendor_name?: string;
  last_updated: string;
}

export interface MaterialPlanningSearchParams {
  query?: string;
  status_filter?: 'Normal' | 'Low' | 'Critical' | 'Overstocked' | 'all';
  class_filter?: string;
  brand_filter?: string;
  category_filter?: string;
  threshold_type_filter?: 'overall' | 'monthly' | 'all';
  page?: number;
  limit?: number;
  sort_by?: 'sku_code' | 'status' | 'inventory' | 'threshold';
  sort_order?: 'asc' | 'desc';
}

export interface MaterialPlanningResult {
  items: MaterialPlanningItem[];
  total_count: number;
  page: number;
  limit: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface MaterialPlanningStatistics {
  total_skus: number;
  normal_count: number;
  low_count: number;
  critical_count: number;
  overstocked_count: number;
  overall_threshold_count: number;
  monthly_threshold_count: number;
  no_threshold_count: number;
}

export interface ThresholdCalculation {
  min_threshold: number;
  optimal_threshold: number;
  source: 'overall' | 'monthly';
  current_month?: number;
  is_configured: boolean;
}

export interface MonthlyThresholdData {
  [month: string]: {
    minStock: number;
    maxStock: number;
  };
}

// Utility type for class with threshold data
export interface ClassWithThresholds extends Class {
  stock_management_type: 'overall' | 'monthly';
  overall_min_stock: number;
  overall_max_stock: number;
  monthly_stock_levels: MonthlyThresholdData;
}

export interface ReorderRequest {
  sku_id: string;
  sku_code: string;
  class_id: string;
  size_id?: string;
  current_inventory: number;
  min_threshold: number;
  optimal_threshold: number;
  preferred_vendor_id?: string;
  auto_reorder: boolean;
  reorder_quantity?: number;
}

export interface CreatePORequest {
  vendor_id: string;
  items: Array<{
    sku_id: string;
    size_id?: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
  auto_generated: boolean;
  source: 'manual' | 'auto_reorder';
  reorder_trigger_type?: 'auto_schedule' | 'inventory_change' | 'manual';
  related_sku_ids?: string[];
}

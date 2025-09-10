import type { BaseActivityEntry, ActivitySession } from '@/components/common/session-logger';

// Return-specific entry that extends the base activity entry
export interface ReturnEntry extends BaseActivityEntry {
  return_reason: 'damaged' | 'defective' | 'wrong_item' | 'excess' | 'customer_return';
  condition: 'good' | 'damaged' | 'defective';
  
  // Split quantities
  return_to_vendor_qty: number;
  accept_to_stock_qty: number;
  total_quantity: number; // return_to_vendor_qty + accept_to_stock_qty
  quantity: number; // Legacy field for backward compatibility
  
  // Location fields (for accepted stock)
  warehouse_id: string;
  warehouse_name?: string;
  floor_id: string;
  floor_name?: string;
  lane_id: string;
  lane_name?: string;
  rack_id: string;
  rack_name?: string;
  accept_condition?: 'good' | 'damaged' | 'defective';
  
  // Legacy fields
  notes?: string;
  customer_order_id?: string;
  pending: number;
}

// Return session type
export type ReturnSession = ActivitySession<ReturnEntry>;

// Data structure for saving Return sessions to database
export interface ReturnSessionSaveData {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  return_reason: string;
  condition: string;
  
  // Split quantities
  return_to_vendor_qty: number;
  accept_to_stock_qty: number;
  quantity: number; // total
  
  // Location data (for accepted stock)
  warehouse_id?: string;
  floor_id?: string;
  lane_id?: string;
  rack_id?: string;
  accept_condition?: string;
  
  // Legacy fields
  notes?: string;
  customer_order_id?: string;
}

// Props for the Return modal
export interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceId: string; // Could be order ID, GRN ID, etc.
  referenceType: 'order' | 'grn' | 'inventory';
  referenceNumber: string;
  onRefresh?: () => void;
}

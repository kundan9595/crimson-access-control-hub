import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderStatus } from '@/types/purchaseOrder';

export interface PurchaseOrderItem {
  sku_id: string;
  size_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrderMiscItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreatePurchaseOrderData {
  vendor_id: string;
  notes?: string;
  items: PurchaseOrderItem[];
  misc_items: PurchaseOrderMiscItem[];
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  item_count: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderDetails {
  po: PurchaseOrder;
  items: Array<{
    id: string;
    sku_id: string;
    sku_code: string;
    sku_name: string;
    size_id: string;
    size_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  misc_items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

class PurchaseOrderService {
  async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<string> {
    try {
      // Create the purchase order
      const { data: poData, error: poError } = await supabase.rpc('create_purchase_order', {
        p_vendor_id: data.vendor_id,
        p_notes: data.notes || null,
        p_created_by: null // Will be set by RLS
      });

      if (poError) throw poError;

      const poId = poData;

      // Add SKU items if any
      if (data.items.length > 0) {
        const { error: itemsError } = await supabase.rpc('add_po_sku_items', {
          p_po_id: poId,
          p_items: data.items
        });

        if (itemsError) throw itemsError;
      }

      // Add misc items if any
      if (data.misc_items.length > 0) {
        const { error: miscError } = await supabase.rpc('add_po_misc_items', {
          p_po_id: poId,
          p_items: data.misc_items
        });

        if (miscError) throw miscError;
      }

      return poId;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  async getPurchaseOrders(status?: PurchaseOrderStatus, vendor_id?: string): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase.rpc('get_purchase_orders', {
        p_status: status || null,
        p_vendor_id: vendor_id || null
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async getPurchaseOrderDetails(poId: string): Promise<PurchaseOrderDetails> {
    try {
      const { data, error } = await supabase.rpc('get_purchase_order_details', {
        p_po_id: poId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      throw error;
    }
  }

  async updatePurchaseOrderStatus(poId: string, status: PurchaseOrderStatus): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_po_status', {
        p_po_id: poId,
        p_status: status,
        p_updated_by: null // Will be set by RLS
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }
}

export const purchaseOrderService = new PurchaseOrderService();

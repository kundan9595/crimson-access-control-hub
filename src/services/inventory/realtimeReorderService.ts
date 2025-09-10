import { supabase } from '@/integrations/supabase/client';

export interface PendingReorderProcessResult {
  success: boolean;
  processed_count: number;
  success_count: number;
  error_count: number;
  created_pos: string[];
  message: string;
}

export class RealtimeReorderService {
  /**
   * Process pending reorders that were triggered by inventory changes
   */
  async processPendingReorders(): Promise<PendingReorderProcessResult> {
    try {
      const { data, error } = await supabase.rpc('api_process_pending_reorders');

      if (error) {
        console.error('Error processing pending reorders:', error);
        return {
          success: false,
          processed_count: 0,
          success_count: 0,
          error_count: 0,
          created_pos: [],
          message: `Error processing pending reorders: ${error.message}`
        };
      }

      return data as PendingReorderProcessResult;
    } catch (error) {
      console.error('Error in processPendingReorders:', error);
      return {
        success: false,
        processed_count: 0,
        success_count: 0,
        error_count: 0,
        created_pos: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get pending reorder history entries
   */
  async getPendingReorders(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .select(`
          id,
          sku_id,
          trigger_type,
          trigger_timestamp,
          inventory_level,
          min_threshold,
          optimal_threshold,
          reorder_quantity,
          vendor_id,
          status,
          notes,
          skus!inner(sku_code, description),
          vendors(name, code)
        `)
        .eq('status', 'pending')
        .eq('trigger_type', 'inventory_change')
        .order('trigger_timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching pending reorders:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getPendingReorders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get reorder history for a specific SKU
   */
  async getReorderHistoryForSKU(skuId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .select(`
          id,
          trigger_type,
          trigger_timestamp,
          inventory_level,
          min_threshold,
          optimal_threshold,
          reorder_quantity,
          vendor_id,
          purchase_order_id,
          status,
          notes,
          created_at,
          updated_at,
          vendors(name, code),
          purchase_orders(po_number, status)
        `)
        .eq('sku_id', skuId)
        .order('trigger_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching reorder history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getReorderHistoryForSKU:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Subscribe to inventory changes for real-time reorder processing
   */
  subscribeToInventoryChanges(callback: (payload: any) => void) {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'warehouse_inventory',
          filter: 'available_quantity=neq.old.available_quantity'
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Subscribe to reorder history changes
   */
  subscribeToReorderHistory(callback: (payload: any) => void) {
    const channel = supabase
      .channel('reorder-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reorder_history'
        },
        callback
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

  /**
   * Check if a SKU has any pending reorders
   */
  async hasPendingReorder(skuId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .select('id')
        .eq('sku_id', skuId)
        .in('status', ['pending', 'po_created'])
        .limit(1);

      if (error) {
        console.error('Error checking pending reorder:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error in hasPendingReorder:', error);
      return false;
    }
  }

  /**
   * Get reorder statistics
   */
  async getReorderStatistics(): Promise<{
    success: boolean;
    data?: {
      total_reorders: number;
      pending_reorders: number;
      successful_reorders: number;
      failed_reorders: number;
      auto_schedule_count: number;
      inventory_change_count: number;
      manual_count: number;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .select('status, trigger_type');

      if (error) {
        console.error('Error fetching reorder statistics:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const stats = {
        total_reorders: data?.length || 0,
        pending_reorders: data?.filter(r => r.status === 'pending').length || 0,
        successful_reorders: data?.filter(r => r.status === 'po_created').length || 0,
        failed_reorders: data?.filter(r => r.status === 'failed').length || 0,
        auto_schedule_count: data?.filter(r => r.trigger_type === 'auto_schedule').length || 0,
        inventory_change_count: data?.filter(r => r.trigger_type === 'inventory_change').length || 0,
        manual_count: data?.filter(r => r.trigger_type === 'manual').length || 0,
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error in getReorderStatistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const realtimeReorderService = new RealtimeReorderService();

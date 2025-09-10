import { supabase } from '@/integrations/supabase/client';

export interface GRNItem {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  sku_code?: string;
  sku_name?: string;
  size_id?: string;
  size_name?: string;
  size_code?: string;
  misc_name?: string;
  ordered_quantity: number;
}

export interface GRNSession {
  session_id: string;
  session_name: string;
  session_timestamp: string;
  is_saved: boolean;
  items: Array<{
    item_type: 'sku' | 'misc';
    item_id: string;
    sku_id?: string;
    size_id?: string;
    misc_name?: string;
    ordered_quantity: number;
    good_quantity: number;
    bad_quantity: number;
  }>;
}

export interface GRNSessionData {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  ordered_quantity: number;
  good_quantity: number;
  bad_quantity: number;
}

export class GRNService {
  // Get GRN data for a purchase order
  static async getGRNDataForPO(poId: string): Promise<GRNItem[]> {
    console.log('Fetching GRN data for PO:', poId);
    const { data, error } = await supabase
      .rpc('get_grn_data_for_po', { p_po_id: poId });

    if (error) {
      console.error('Error fetching GRN data:', error);
      throw new Error(`Failed to fetch GRN data: ${error.message}`);
    }

    console.log('GRN data returned:', data);
    return data || [];
  }

  // Create a new GRN entry
  static async createGRNEntry(poId: string, notes?: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_grn_entry', { 
        p_po_id: poId, 
        p_notes: notes 
      });

    if (error) {
      throw new Error(`Failed to create GRN entry: ${error.message}`);
    }

    return data;
  }

  // Save a GRN session
  static async saveGRNSession(
    grnEntryId: string, 
    sessionName: string, 
    sessionData: GRNSessionData[]
  ): Promise<string> {
    console.log('💾 GRNService.saveGRNSession called with:');
    console.log('  - grnEntryId:', grnEntryId);
    console.log('  - sessionName:', sessionName);
    console.log('  - sessionData:', sessionData);
    
    const { data, error } = await supabase
      .rpc('save_grn_session', {
        p_grn_entry_id: grnEntryId,
        p_session_name: sessionName,
        p_session_data: sessionData
      });

    if (error) {
      console.error('❌ Error saving GRN session:', error);
      throw new Error(`Failed to save GRN session: ${error.message}`);
    }

    console.log('✅ GRN session saved successfully, returned data:', data);
    return data;
  }

  // Get GRN sessions for a purchase order
  static async getGRNSessions(poId: string): Promise<GRNSession[]> {
    console.log('📥 Fetching GRN sessions for PO:', poId);
    const { data, error } = await supabase
      .rpc('get_grn_sessions', { p_po_id: poId });

    if (error) {
      console.error('❌ Error fetching GRN sessions:', error);
      throw new Error(`Failed to fetch GRN sessions: ${error.message}`);
    }

    console.log('📥 GRN sessions returned from database:', data);
    return data || [];
  }

  // Get or create GRN entry and return sessions
  static async getOrCreateGRNEntry(poId: string): Promise<{
    grnEntryId: string;
    sessions: GRNSession[];
    items: GRNItem[];
  }> {
    // First, try to get existing GRN entry
    const { data: existingEntry } = await supabase
      .from('grn_entries')
      .select('id')
      .eq('purchase_order_id', poId)
      .single();

    let grnEntryId: string;

    if (existingEntry) {
      grnEntryId = existingEntry.id;
    } else {
      // Create new GRN entry
      grnEntryId = await this.createGRNEntry(poId);
    }

    // Get sessions and items
    const [sessions, items] = await Promise.all([
      this.getGRNSessions(poId),
      this.getGRNDataForPO(poId)
    ]);

    return {
      grnEntryId,
      sessions,
      items
    };
  }

  // Calculate pending quantities based on sessions
  static calculatePendingQuantities(
    items: GRNItem[], 
    sessions: GRNSession[]
  ): Array<GRNItem & { pending_quantity: number; total_received: number }> {
    return items.map(item => {
      let totalReceived = 0;
      
      // Calculate total received from all saved sessions
      sessions.forEach(session => {
        if (session.is_saved) {
          const sessionItem = session.items.find(
            si => {
              if (item.item_type === 'sku') {
                return si.sku_id === item.sku_id && si.size_id === item.size_id;
              } else {
                return si.misc_name === item.misc_name;
              }
            }
          );
          if (sessionItem) {
            totalReceived += sessionItem.good_quantity + sessionItem.bad_quantity;
          }
        }
      });
      
      const pendingQuantity = Math.max(0, item.ordered_quantity - totalReceived);
      
      return {
        ...item,
        pending_quantity: pendingQuantity,
        total_received: totalReceived
      };
    });
  }

  // Delete a GRN session
  static async deleteGRNSession(sessionName: string, grnEntryId: string): Promise<void> {
    console.log('🗑️ Deleting GRN session:', sessionName, 'for entry:', grnEntryId);
    
    // Delete all receipts for this session
    const { error: receiptsError } = await supabase
      .from('grn_receipts')
      .delete()
      .eq('grn_entry_id', grnEntryId)
      .eq('session_name', sessionName);

    if (receiptsError) {
      console.error('❌ Error deleting GRN receipts:', receiptsError);
      throw new Error(`Failed to delete GRN receipts: ${receiptsError.message}`);
    }

    console.log('✅ GRN session receipts deleted successfully');
  }

  // Calculate and update purchase order status based on GRN receipts
  static async updatePurchaseOrderStatus(grnEntryId: string): Promise<void> {
    try {
      console.log('🔄 Updating PO status for GRN entry:', grnEntryId);
      
      // Get the purchase order ID from the GRN entry
      const { data: grnEntry, error: grnError } = await supabase
        .from('grn_entries')
        .select('purchase_order_id')
        .eq('id', grnEntryId)
        .single();

      if (grnError) {
        console.error('❌ Error fetching GRN entry:', grnError);
        throw new Error(`Failed to fetch GRN entry: ${grnError.message}`);
      }

      if (!grnEntry) {
        console.error('❌ GRN entry not found');
        return;
      }

      const poId = grnEntry.purchase_order_id;

      // Get original ordered quantities from purchase order items
      const { data: poItems, error: poItemsError } = await supabase
        .from('purchase_order_items')
        .select('quantity')
        .eq('purchase_order_id', poId);

      if (poItemsError) {
        console.error('❌ Error fetching PO items:', poItemsError);
        throw new Error(`Failed to fetch PO items: ${poItemsError.message}`);
      }

      // Get misc items quantities
      const { data: poMiscItems, error: poMiscItemsError } = await supabase
        .from('purchase_order_misc_items')
        .select('quantity')
        .eq('purchase_order_id', poId);

      if (poMiscItemsError) {
        console.error('❌ Error fetching PO misc items:', poMiscItemsError);
        throw new Error(`Failed to fetch PO misc items: ${poMiscItemsError.message}`);
      }

      // Calculate total ordered quantities
      const totalOrdered = (poItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0) + 
                          (poMiscItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0);

      // Get all GRN receipts for this PO
      const { data: receipts, error: receiptsError } = await supabase
        .from('grn_receipts')
        .select('good_quantity, bad_quantity')
        .eq('grn_entry_id', grnEntryId)
        .eq('is_saved', true);

      if (receiptsError) {
        console.error('❌ Error fetching GRN receipts:', receiptsError);
        throw new Error(`Failed to fetch GRN receipts: ${receiptsError.message}`);
      }

      // Calculate total received quantities
      const totalReceived = receipts?.reduce((sum, receipt) => 
        sum + (receipt.good_quantity || 0) + (receipt.bad_quantity || 0), 0
      ) || 0;

      console.log('📊 PO Status Calculation:', {
        poId,
        totalOrdered,
        totalReceived,
        receiptsCount: receipts?.length || 0
      });

      // Determine the new status
      let newStatus: string;
      if (totalReceived === 0) {
        // No items received yet - revert to sent_to_vendor
        newStatus = 'sent_to_vendor';
        console.log('📊 No items received, reverting to sent_to_vendor');
      } else if (totalReceived >= totalOrdered) {
        // All items received (including good and bad)
        newStatus = 'received';
        console.log('📊 All items received, setting to received');
      } else {
        // Some items received but not all
        newStatus = 'partially_received';
        console.log('📊 Some items received, setting to partially_received');
      }

      // Update the purchase order status
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', poId);

      if (updateError) {
        console.error('❌ Error updating PO status:', updateError);
        throw new Error(`Failed to update PO status: ${updateError.message}`);
      }

      console.log(`✅ PO status updated to: ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating purchase order status:', error);
      // Don't throw the error to avoid breaking the GRN flow
      console.warn('⚠️ PO status update failed, but GRN operation will continue');
    }
  }
}

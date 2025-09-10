import { supabase } from '@/integrations/supabase/client';
import type { SessionService } from '@/components/common/session-logger';
import type { PutAwayEntry, PutAwaySession, PutAwaySessionSaveData } from '../types/putAwayTypes';

/**
 * Put Away Session Service
 * Manages put away operations for received goods from GRN
 */
export class PutAwaySessionService implements SessionService<PutAwayEntry, PutAwaySessionSaveData> {
  
  async loadSessions(poId: string): Promise<PutAwaySession[]> {
    try {
      // First, get the GRN entry ID for this PO
      const { data: grnEntry, error: grnEntryError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnEntryError || !grnEntry) {
        console.log('No GRN entry found for PO:', poId);
        return [];
      }

      const grnId = grnEntry.id;

      // Get items from GRN that are available for put away
      const { data: grnItems, error: grnError } = await supabase
        .rpc('get_putaway_items_for_grn', { p_grn_id: grnId });

      if (grnError) {
        console.error('Error fetching GRN put away items:', grnError);
        throw new Error(`Failed to fetch GRN items: ${grnError.message}`);
      }

      // Convert GRN items to put away entries
      const putAwayEntries: PutAwayEntry[] = (grnItems || []).map((item: any) => ({
        id: item.item_id, // Use the aggregated item_id from the database function
        item_type: item.item_type,
        item_id: item.item_id,
        sku_id: item.sku_id,
        sku_code: item.sku_code,
        sku_name: item.sku_name,
        size_id: item.size_id,
        size_name: item.size_name,
        size_code: item.size_code,
        misc_name: item.misc_name,
        ordered: item.good_quantity || 0, // Available quantity from GRN (now properly aggregated)
        warehouse_id: '',
        warehouse_name: '',
        floor_id: '',
        floor_name: '',
        lane_id: '',
        lane_name: '',
        rack_id: '',
        rack_name: '',
        quantity: 0,
        location_notes: '',
        pending: item.good_quantity || 0
      }));

      // Get existing put away sessions
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_putaway_sessions', { p_grn_id: grnId });

      if (sessionsError) {
        console.error('Error fetching put away sessions:', sessionsError);
        throw new Error(`Failed to fetch put away sessions: ${sessionsError.message}`);
      }

      // Convert database sessions to put away sessions
      const putAwaySessions: PutAwaySession[] = (sessions || [])
        .filter((session: any) => session.session_id !== null)
        .map((session: any) => {
          const sessionEntries = session.items.map((item: any) => {
            const baseEntry = putAwayEntries.find(entry => {
              if (entry.item_type === 'sku' && item.item_type === 'sku') {
                return entry.sku_id === item.sku_id && entry.size_id === item.size_id;
              } else if (entry.item_type === 'misc' && item.item_type === 'misc') {
                return entry.misc_name === item.misc_name;
              }
              return false;
            });
            
            if (!baseEntry) return null;

            return {
              ...baseEntry,
              warehouse_id: item.warehouse_id || '',
              floor_id: item.floor_id || '',
              lane_id: item.lane_id || '',
              rack_id: item.rack_id || '',
              quantity: item.quantity || 0,
              location_notes: item.location_notes || '',
              pending: 0 // Will be calculated by pending calculations hook
            };
          }).filter(Boolean) as PutAwayEntry[];
          
          return {
            id: session.session_id!,
            name: session.session_name!,
            timestamp: new Date(session.session_timestamp!),
            entries: sessionEntries,
            isSaved: session.is_saved!
          };
        });

      // Add "Today" session for new put away operations
      if (putAwayEntries.length > 0) {
        // Calculate remaining quantities after existing put away sessions
        const remainingEntries = putAwayEntries.map(baseEntry => {
          let totalPutAway = 0;
          
          putAwaySessions.forEach(session => {
            if (session.isSaved) {
              const sessionEntry = session.entries.find(entry => entry.id === baseEntry.id);
              if (sessionEntry) {
                totalPutAway += sessionEntry.quantity;
              }
            }
          });
          
          const remainingQuantity = Math.max(0, baseEntry.ordered - totalPutAway);
          
          return {
            ...baseEntry,
            pending: remainingQuantity,
            quantity: 0
          };
        }).filter(entry => entry.pending > 0); // Only show items that still need put away

        if (remainingEntries.length > 0) {
          putAwaySessions.push({
            id: 'today',
            name: 'Today',
            timestamp: new Date(),
            entries: remainingEntries,
            isSaved: false
          });
        }
      }

      return putAwaySessions;
    } catch (error) {
      console.error('Error loading put away sessions:', error);
      throw error;
    }
  }

  async saveSession(poId: string, sessionName: string, sessionData: PutAwaySessionSaveData[]): Promise<string> {
    try {
      // First, get the GRN entry ID for this PO
      const { data: grnEntry, error: grnEntryError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnEntryError || !grnEntry) {
        throw new Error(`No GRN entry found for PO: ${poId}`);
      }

      const grnId = grnEntry.id;

      // Save put away session
      const { data, error } = await supabase
        .rpc('save_putaway_session', {
          p_grn_id: grnId,
          p_session_name: sessionName,
          p_session_data: sessionData
        });

      if (error) {
        console.error('Error saving put away session:', error);
        throw new Error(`Failed to save put away session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error saving put away session:', error);
      throw error;
    }
  }

  async deleteSession(sessionName: string, poId: string): Promise<void> {
    try {
      // First, get the GRN entry ID for this PO
      const { data: grnEntry, error: grnEntryError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnEntryError || !grnEntry) {
        throw new Error(`No GRN entry found for PO: ${poId}`);
      }

      const grnId = grnEntry.id;

      // Delete put away session
      const { error } = await supabase
        .rpc('delete_putaway_session', {
          p_grn_id: grnId,
          p_session_id: sessionName
        });

      if (error) {
        console.error('Error deleting put away session:', error);
        throw new Error(`Failed to delete put away session: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting put away session:', error);
      throw error;
    }
  }

  async updateStatus(poId: string): Promise<void> {
    try {
      // First, get the GRN entry ID for this PO
      const { data: grnEntry, error: grnEntryError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnEntryError || !grnEntry) {
        console.warn(`No GRN entry found for PO: ${poId}`);
        return;
      }

      const grnId = grnEntry.id;

      // Update GRN put away status
      const { error } = await supabase
        .rpc('update_grn_putaway_status', {
          p_grn_id: grnId
        });

      if (error) {
        console.error('Error updating GRN put away status:', error);
        throw new Error(`Failed to update GRN put away status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating GRN put away status:', error);
      // Don't throw the error to avoid breaking the put away flow
      console.warn('⚠️ GRN put away status update failed, but put away operation will continue');
    }
  }
}

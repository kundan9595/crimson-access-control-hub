import { supabase } from '@/integrations/supabase/client';
import type { SessionService } from '@/components/common/session-logger';
import type { ReturnEntry, ReturnSession, ReturnSessionSaveData } from '../types/returnTypes';

/**
 * Return Session Service
 * Manages return operations for various types of items
 */
export class ReturnSessionService implements SessionService<ReturnEntry, ReturnSessionSaveData> {
  
  async loadSessions(referenceId: string): Promise<ReturnSession[]> {
    try {
      // Get items available for return based on reference type
      const { data: returnItems, error: itemsError } = await supabase
        .rpc('get_return_items_for_reference', { 
          p_reference_id: referenceId 
        });

      if (itemsError) {
        console.error('Error fetching return items:', itemsError);
        throw new Error(`Failed to fetch return items: ${itemsError.message}`);
      }

      // Convert return items to return entries
      const returnEntries: ReturnEntry[] = (returnItems || []).map((item: any) => ({
        id: item.item_type === 'sku' ? `${item.sku_id}-${item.size_id}` : item.item_id,
        item_type: item.item_type,
        item_id: item.item_id,
        sku_id: item.sku_id,
        sku_code: item.sku_code,
        sku_name: item.sku_name,
        size_id: item.size_id,
        size_name: item.size_name,
        size_code: item.size_code,
        misc_name: item.misc_name,
        ordered: item.available_quantity || 0, // Available quantity for return
        return_reason: '',
        condition: '',
        
        // Split quantities - initialize to 0
        return_to_vendor_qty: 0,
        accept_to_stock_qty: 0,
        total_quantity: 0,
        quantity: 0, // Legacy field
        
        // Location fields - initialize empty
        warehouse_id: '',
        warehouse_name: '',
        floor_id: '',
        floor_name: '',
        lane_id: '',
        lane_name: '',
        rack_id: '',
        rack_name: '',
        accept_condition: 'damaged',
        
        // Legacy fields
        notes: '',
        customer_order_id: item.customer_order_id,
        pending: item.available_quantity || 0
      }));

      // Get existing return sessions
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_return_sessions', { p_reference_id: referenceId });

      if (sessionsError) {
        console.error('Error fetching return sessions:', sessionsError);
        throw new Error(`Failed to fetch return sessions: ${sessionsError.message}`);
      }

      // Convert database sessions to return sessions
      const returnSessions: ReturnSession[] = (sessions || [])
        .filter((session: any) => session.session_id !== null)
        .map((session: any) => {
          const sessionEntries = session.items.map((item: any) => {
            const baseEntry = returnEntries.find(entry => {
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
              return_reason: item.return_reason || 'damaged',
              condition: item.condition || 'damaged',
              
              // Split quantities
              return_to_vendor_qty: item.return_to_vendor_qty || 0,
              accept_to_stock_qty: item.accept_to_stock_qty || 0,
              total_quantity: (item.return_to_vendor_qty || 0) + (item.accept_to_stock_qty || 0),
              quantity: item.quantity || 0, // Legacy field
              
              // Location fields
              warehouse_id: item.warehouse_id || '',
              floor_id: item.floor_id || '',
              lane_id: item.lane_id || '',
              rack_id: item.rack_id || '',
              accept_condition: item.accept_condition || 'damaged',
              
              // Legacy fields
              notes: item.notes || '',
              customer_order_id: item.customer_order_id,
              pending: 0 // Will be calculated by pending calculations hook
            };
          }).filter(Boolean) as ReturnEntry[];
          
          return {
            id: session.session_id!,
            name: session.session_name!,
            timestamp: new Date(session.session_timestamp!),
            entries: sessionEntries,
            isSaved: session.is_saved!
          };
        });

      // Add "Today" session for new return operations
      if (returnEntries.length > 0) {
        // Calculate remaining quantities after existing return sessions
        const remainingEntries = returnEntries.map(baseEntry => {
          let totalReturned = 0;
          
          returnSessions.forEach(session => {
            if (session.isSaved) {
              const sessionEntry = session.entries.find(entry => entry.id === baseEntry.id);
              if (sessionEntry) {
                totalReturned += sessionEntry.quantity;
              }
            }
          });
          
          const remainingQuantity = Math.max(0, baseEntry.ordered - totalReturned);
          
          return {
            ...baseEntry,
            pending: remainingQuantity,
            return_to_vendor_qty: 0,
            accept_to_stock_qty: 0,
            total_quantity: 0,
            quantity: 0
          };
        }).filter(entry => entry.pending > 0); // Only show items that can still be returned

        if (remainingEntries.length > 0) {
          returnSessions.push({
            id: 'today',
            name: 'Today',
            timestamp: new Date(),
            entries: remainingEntries,
            isSaved: false
          });
        }
      }

      return returnSessions;
    } catch (error) {
      console.error('Error loading return sessions:', error);
      throw error;
    }
  }

  async saveSession(referenceId: string, sessionName: string, sessionData: ReturnSessionSaveData[]): Promise<string> {
    try {
      // Save return session
      const { data, error } = await supabase
        .rpc('save_return_session', {
          p_reference_id: referenceId,
          p_session_name: sessionName,
          p_session_data: sessionData
        });

      if (error) {
        console.error('Error saving return session:', error);
        throw new Error(`Failed to save return session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error saving return session:', error);
      throw error;
    }
  }

  async deleteSession(sessionName: string, referenceId: string): Promise<void> {
    try {
      // Delete return session
      const { error } = await supabase
        .rpc('delete_return_session', {
          p_reference_id: referenceId,
          p_session_name: sessionName
        });

      if (error) {
        console.error('Error deleting return session:', error);
        throw new Error(`Failed to delete return session: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting return session:', error);
      throw error;
    }
  }

  async updateStatus(referenceId: string): Promise<void> {
    try {
      // Update reference status based on returns
      const { error } = await supabase
        .rpc('update_reference_return_status', {
          p_reference_id: referenceId
        });

      if (error) {
        console.error('Error updating return status:', error);
        throw new Error(`Failed to update return status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating return status:', error);
      // Don't throw the error to avoid breaking the return flow
      console.warn('⚠️ Return status update failed, but return operation will continue');
    }
  }
}

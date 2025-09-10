import type { SessionService } from '@/components/common/session-logger';
import { GRNService } from '@/services/grnService';
import type { GRNEntry, GRNSession, GRNSessionSaveData } from '../types/grnTypes';

/**
 * GRN Session Service Adapter
 * Adapts the existing GRNService to work with the new SessionService interface
 */
export class GRNSessionService implements SessionService<GRNEntry, GRNSessionSaveData> {
  
  async loadSessions(poId: string): Promise<GRNSession[]> {
    try {
      // Get or create GRN entry and load sessions and items
      const { grnEntryId, sessions, items } = await GRNService.getOrCreateGRNEntry(poId);
      
      // Convert database items to GRN entries
      const grnEntries: GRNEntry[] = items.map((item) => ({
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
        ordered: item.ordered_quantity || 0,
        goodQuantity: 0,
        badQuantity: 0,
        pending: item.ordered_quantity || 0 // Will be calculated later
      }));

      // Convert database sessions to GRN sessions
      const grnSessions: GRNSession[] = sessions
        .filter(session => session.session_id !== null)
        .map(session => {
          const sessionEntries = session.items.map(item => {
            const baseEntry = grnEntries.find(entry => {
              if (entry.item_type === 'sku' && item.item_type === 'sku') {
                return entry.sku_id === item.sku_id && entry.size_id === item.size_id;
              } else if (entry.item_type === 'misc' && item.item_type === 'misc') {
                return entry.misc_name === item.misc_name;
              }
              return false;
            });
            
            if (!baseEntry) {
              throw new Error(`Base entry not found for session item: ${JSON.stringify(item)}`);
            }

            return {
              ...baseEntry,
              goodQuantity: item.good_quantity || 0,
              badQuantity: item.bad_quantity || 0,
              pending: 0 // Will be calculated by the pending calculations hook
            };
          }).filter(Boolean) as GRNEntry[];
          
          return {
            id: session.session_id!,
            name: session.session_name!,
            timestamp: new Date(session.session_timestamp!),
            entries: sessionEntries,
            isSaved: session.is_saved!
          };
        });

      // Check PO status to determine if we should add a "Today" session
      const { data: poData } = await (await import('@/integrations/supabase/client')).supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', poId)
        .single();

      const shouldShowTodayTab = poData?.status === 'sent_to_vendor' || poData?.status === 'partially_received';
      
      if (shouldShowTodayTab) {
        // Calculate remaining pending quantities for Today tab
        const remainingEntries = grnEntries.map(baseEntry => {
          let totalReceived = 0;
          
          // Sum up all received quantities from saved sessions
          grnSessions.forEach(session => {
            if (session.isSaved) {
              const sessionEntry = session.entries.find(entry => 
                entry.item_type === 'sku' 
                  ? (entry.sku_id === baseEntry.sku_id && entry.size_id === baseEntry.size_id)
                  : entry.item_id === baseEntry.item_id
              );
              if (sessionEntry) {
                totalReceived += sessionEntry.goodQuantity + sessionEntry.badQuantity;
              }
            }
          });
          
          const remainingPending = Math.max(0, baseEntry.ordered - totalReceived);
          
          return {
            ...baseEntry,
            pending: remainingPending,
            goodQuantity: 0,
            badQuantity: 0
          };
        });

        // Add "Today" session
        grnSessions.push({
          id: 'today',
          name: 'Today',
          timestamp: new Date(),
          entries: remainingEntries,
          isSaved: false
        });
      }

      // Store the GRN entry ID for later use
      (this as any)._grnEntryId = grnEntryId;
      
      return grnSessions;
    } catch (error) {
      console.error('Error loading GRN sessions:', error);
      throw error;
    }
  }

  async saveSession(poId: string, sessionName: string, sessionData: GRNSessionSaveData[]): Promise<string> {
    try {
      const grnEntryId = (this as any)._grnEntryId;
      if (!grnEntryId) {
        throw new Error('GRN entry ID not found. Load sessions first.');
      }

      // Save using the existing GRN service
      const result = await GRNService.saveGRNSession(grnEntryId, sessionName, sessionData);
      return result;
    } catch (error) {
      console.error('Error saving GRN session:', error);
      throw error;
    }
  }

  async deleteSession(sessionName: string, poId: string): Promise<void> {
    try {
      const grnEntryId = (this as any)._grnEntryId;
      if (!grnEntryId) {
        throw new Error('GRN entry ID not found. Load sessions first.');
      }

      // Delete using the existing GRN service
      await GRNService.deleteGRNSession(sessionName, grnEntryId);
    } catch (error) {
      console.error('Error deleting GRN session:', error);
      throw error;
    }
  }

  async updateStatus(poId: string): Promise<void> {
    try {
      const grnEntryId = (this as any)._grnEntryId;
      if (!grnEntryId) {
        throw new Error('GRN entry ID not found. Load sessions first.');
      }

      // Update PO status using the existing GRN service
      await GRNService.updatePurchaseOrderStatus(grnEntryId);
    } catch (error) {
      console.error('Error updating PO status:', error);
      throw error;
    }
  }
}

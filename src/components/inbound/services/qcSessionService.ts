import { supabase } from '@/integrations/supabase/client';
import type { QCEntry, QCSessionSaveData } from '../types/qcTypes';

/**
 * QC Service
 * Manages quality control operations for received goods from GRN
 * Simplified to work with single qc_reports table
 */
export class QCSessionService {
  
  async loadSessions(poId: string): Promise<QCEntry[]> {
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

      // Get items from GRN that are available for QC (items that have been received)
      const { data: grnItems, error: grnError } = await supabase
        .rpc('get_qc_items_for_grn', { p_grn_id: grnId });

      if (grnError) {
        console.error('Error fetching GRN items for QC:', grnError);
        throw new Error(`Failed to fetch GRN items: ${grnError.message}`);
      }

      // Convert GRN items to QC entries
      const qcEntries: QCEntry[] = (grnItems || []).map((item: any) => ({
        id: item.item_id,
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
        received_qty: item.received_quantity || 0,
        samples_checked: 0,
        samples_ok: 0,
        samples_not_ok: 0,
        qc_percentage: 0,
        pending: item.received_quantity || 0
      }));

      // Get existing QC reports to calculate remaining quantities
      const { data: qcReports, error: reportsError } = await supabase
        .rpc('get_qc_reports', { p_grn_id: grnId });

      if (reportsError) {
        console.error('Error fetching QC reports:', reportsError);
        throw new Error(`Failed to fetch QC reports: ${reportsError.message}`);
      }

      // Calculate remaining quantities for each item
      const updatedEntries = qcEntries.map(entry => {
        let totalQCDone = 0;
        
        // Sum up all QC quantities from existing reports
        (qcReports || []).forEach(report => {
          if (entry.item_type === 'sku' && report.item_type === 'sku') {
            if (entry.sku_id === report.sku_id && entry.size_id === report.size_id) {
              totalQCDone += report.samples_checked || 0;
            }
          } else if (entry.item_type === 'misc' && report.item_type === 'misc') {
            if (entry.misc_name === report.misc_name) {
              totalQCDone += report.samples_checked || 0;
            }
          }
        });
        
        const remainingPending = Math.max(0, entry.received_qty - totalQCDone);
        
        return {
          ...entry,
          pending: remainingPending,
          samples_checked: 0,
          samples_ok: 0,
          samples_not_ok: 0,
          qc_percentage: 0
        };
      });

      return updatedEntries;
    } catch (error) {
      console.error('Error loading QC data:', error);
      throw error;
    }
  }

  async saveSession(poId: string, sessionName: string, sessionData: QCSessionSaveData[]): Promise<string> {
    try {
      // Get the GRN entry ID for this PO
      const { data: grnEntry, error: grnEntryError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnEntryError || !grnEntry) {
        console.error('No GRN entry found for PO:', poId, grnEntryError);
        throw new Error('GRN entry not found for this purchase order');
      }

      const grnId = grnEntry.id;

      // Save QC report using simplified function
      const { data, error } = await supabase
        .rpc('save_qc_report', {
          p_grn_id: grnId,
          p_report_name: sessionName,
          p_report_data: sessionData
        });

      if (error) {
        console.error('Error saving QC report:', error);
        throw new Error(`Failed to save QC report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error saving QC report:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string, poId: string): Promise<void> {
    try {
      // Delete QC report using simplified function
      const { error } = await supabase
        .rpc('delete_qc_report', {
          p_report_id: sessionId
        });

      if (error) {
        console.error('Error deleting QC report:', error);
        throw new Error(`Failed to delete QC report: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting QC report:', error);
      throw error;
    }
  }
}
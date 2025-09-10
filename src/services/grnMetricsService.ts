import { supabase } from '@/integrations/supabase/client';

export interface GRNMetrics {
  grnRatio: string;
  qcPercentage: number;
  putAwayProgress: number;
  r2vAcceptRatio: string;
}

export class GRNMetricsService {
  /**
   * Calculate GRN Ratio: "Good:Bad" ratio of received items
   */
  static async calculateGRNRatio(poId: string): Promise<string> {
    try {
      // Get GRN entry for this PO
      const { data: grnEntry, error: grnError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnError || !grnEntry) {
        console.log('No GRN entry found for PO:', poId);
        return '0:0';
      }

      // Get total ordered and received quantities
      const { data: grnData, error: dataError } = await supabase
        .rpc('get_grn_metrics', { p_grn_id: grnEntry.id });

      if (dataError || !grnData) {
        console.error('Error getting GRN metrics:', dataError);
        return '0:0';
      }

      const metrics = grnData[0];
      if (!metrics || metrics.total_received === 0) {
        return '0:0';
      }

      const ratio = `${metrics.total_good || 0}:${metrics.total_bad || 0}`;
      console.log(`GRN Ratio for PO ${poId}: ${ratio} (${metrics.total_good} good, ${metrics.total_bad} bad out of ${metrics.total_received} received)`);
      return ratio;
    } catch (error) {
      console.error('Error calculating GRN ratio:', error);
      return '0:0';
    }
  }

  /**
   * Calculate QC Percentage: (Samples OK / Samples Checked) * 100
   */
  static async calculateQCPercentage(poId: string): Promise<number> {
    try {
      // Get GRN entry for this PO
      const { data: grnEntry, error: grnError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnError || !grnEntry) {
        console.log('No GRN entry found for QC calculation for PO:', poId);
        return 0;
      }

      // Get QC metrics
      const { data: qcData, error: qcError } = await supabase
        .rpc('get_qc_metrics', { p_grn_id: grnEntry.id });

      if (qcError || !qcData) {
        console.error('Error getting QC metrics:', qcError);
        return 0;
      }

      const metrics = qcData[0];
      if (!metrics || metrics.total_samples_checked === 0) {
        return 0;
      }

      const percentage = Math.round((metrics.total_samples_ok / metrics.total_samples_checked) * 100);
      console.log(`QC Percentage for PO ${poId}: ${metrics.total_samples_ok}/${metrics.total_samples_checked} = ${percentage}%`);
      return percentage;
    } catch (error) {
      console.error('Error calculating QC percentage:', error);
      return 0;
    }
  }

  /**
   * Calculate Put Away Progress: (Total Put Away / Total Received) * 100
   */
  static async calculatePutAwayProgress(poId: string): Promise<number> {
    try {
      // Get GRN entry for this PO
      const { data: grnEntry, error: grnError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnError || !grnEntry) {
        console.log('No GRN entry found for Put Away calculation for PO:', poId);
        return 0;
      }

      // Get put away metrics
      const { data: putAwayData, error: putAwayError } = await supabase
        .rpc('get_putaway_metrics', { p_grn_id: grnEntry.id });

      if (putAwayError || !putAwayData) {
        console.error('Error getting Put Away metrics:', putAwayError);
        return 0;
      }

      const metrics = putAwayData[0];
      if (!metrics || metrics.total_received === 0) {
        return 0;
      }

      const progress = Math.round((metrics.total_put_away / metrics.total_received) * 100);
      console.log(`Put Away Progress for PO ${poId}: ${metrics.total_put_away}/${metrics.total_received} = ${progress}%`);
      return progress;
    } catch (error) {
      console.error('Error calculating put away progress:', error);
      return 0;
    }
  }

  /**
   * Calculate R2V:Accept Ratio: "Return to Vendor Qty : Accept to Stock Qty"
   */
  static async calculateR2VAcceptRatio(poId: string): Promise<string> {
    try {
      // Get GRN entry for this PO
      const { data: grnEntry, error: grnError } = await supabase
        .from('grn_entries')
        .select('id')
        .eq('purchase_order_id', poId)
        .single();

      if (grnError || !grnEntry) {
        console.log('No GRN entry found for Return calculation for PO:', poId);
        return '0:0';
      }

      // Get return metrics
      const { data: returnData, error: returnError } = await supabase
        .rpc('get_return_metrics', { p_grn_id: grnEntry.id });

      if (returnError || !returnData) {
        console.error('Error getting Return metrics:', returnError);
        return '0:0';
      }

      const metrics = returnData[0];
      if (!metrics) {
        return '0:0';
      }

      const ratio = `${metrics.total_return_to_vendor || 0}:${metrics.total_accept_to_stock || 0}`;
      console.log(`R2V:Accept Ratio for PO ${poId}: ${ratio}`);
      return ratio;
    } catch (error) {
      console.error('Error calculating R2V:Accept ratio:', error);
      return '0:0';
    }
  }

  /**
   * Get all metrics for a purchase order
   */
  static async getAllMetrics(poId: string): Promise<GRNMetrics> {
    try {
      const [grnRatio, qcPercentage, putAwayProgress, r2vAcceptRatio] = await Promise.all([
        this.calculateGRNRatio(poId),
        this.calculateQCPercentage(poId),
        this.calculatePutAwayProgress(poId),
        this.calculateR2VAcceptRatio(poId)
      ]);

      return {
        grnRatio,
        qcPercentage,
        putAwayProgress,
        r2vAcceptRatio
      };
    } catch (error) {
      console.error('Error getting all metrics:', error);
      return {
        grnRatio: '0:0',
        qcPercentage: 0,
        putAwayProgress: 0,
        r2vAcceptRatio: '0:0'
      };
    }
  }

  /**
   * Get metrics for multiple purchase orders efficiently
   */
  static async getMetricsForPOs(poIds: string[]): Promise<Record<string, GRNMetrics>> {
    try {
      const metricsPromises = poIds.map(async (poId) => {
        const metrics = await this.getAllMetrics(poId);
        return { poId, metrics };
      });

      const results = await Promise.all(metricsPromises);
      
      return results.reduce((acc, { poId, metrics }) => {
        acc[poId] = metrics;
        return acc;
      }, {} as Record<string, GRNMetrics>);
    } catch (error) {
      console.error('Error getting metrics for POs:', error);
      return {};
    }
  }
}

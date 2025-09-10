import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GRNMetricsService } from '@/services/grnMetricsService';

interface GRNEntry {
  id: string;
  po_number: string;
  created_at: string;
  status: string;
  vendor_name: string;
  items: number;
  grn_ratio: string;
  qc_percentage: string;
  put_away: string;
  r2v_accept: string;
}

export const useGRNData = () => {
  const [grnEntries, setGrnEntries] = useState<GRNEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGRNData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          created_at,
          status,
          vendors!inner(name),
          purchase_order_items(count),
          purchase_order_misc_items(count)
        `)
        .in('status', ['sent_to_vendor', 'partially_received', 'received'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get all PO IDs for batch metrics calculation
      const poIds = data?.map(po => po.id) || [];
      console.log('Calculating metrics for POs:', poIds);
      
      // Calculate metrics for all POs in parallel
      console.log('About to call GRNMetricsService.getMetricsForPOs...');
      const metricsMap = await GRNMetricsService.getMetricsForPOs(poIds);
      console.log('Metrics map:', metricsMap);
      
      // Test individual calculation for debugging
      if (poIds.length > 0) {
        console.log('Testing individual calculation for first PO...');
        const testMetrics = await GRNMetricsService.getAllMetrics(poIds[0]);
        console.log('Individual test metrics:', testMetrics);
      }

      const formattedData: GRNEntry[] = data?.map(po => {
        const metrics = metricsMap[po.id] || {
          grnRatio: '0:0',
          qcPercentage: 0,
          putAwayProgress: 0,
          r2vAcceptRatio: '0:0'
        };

        return {
          id: po.id,
          po_number: po.po_number,
          created_at: po.created_at,
          status: po.status,
          vendor_name: po.vendors?.name || 'Unknown Vendor',
          items: (po.purchase_order_items?.[0]?.count || 0) + (po.purchase_order_misc_items?.[0]?.count || 0),
          grn_ratio: metrics.grnRatio !== '0:0' ? metrics.grnRatio : '-',
          qc_percentage: metrics.qcPercentage > 0 ? `${metrics.qcPercentage}%` : '-',
          put_away: metrics.putAwayProgress > 0 ? `${metrics.putAwayProgress}%` : '-',
          r2v_accept: metrics.r2vAcceptRatio !== '0:0' ? metrics.r2vAcceptRatio : '-'
        };
      }) || [];

      setGrnEntries(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GRN data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGRNData();
  }, []);

  return {
    grnEntries,
    loading,
    error,
    refetch: fetchGRNData
  };
};

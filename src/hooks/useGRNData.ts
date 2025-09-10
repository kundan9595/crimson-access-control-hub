import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      const formattedData: GRNEntry[] = data?.map(po => ({
        id: po.id,
        po_number: po.po_number,
        created_at: po.created_at,
        status: po.status,
        vendor_name: po.vendors?.name || 'Unknown Vendor',
        items: (po.purchase_order_items?.[0]?.count || 0) + (po.purchase_order_misc_items?.[0]?.count || 0),
        grn_ratio: '-',
        qc_percentage: '-',
        put_away: '-',
        r2v_accept: '-'
      })) || [];

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

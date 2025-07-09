
import { supabase } from '@/integrations/supabase/client';
import { Vendor } from './types';

export const fetchVendors = async (): Promise<Vendor[]> => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Vendor[];
};

export const createVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Vendor> => {
  const { data, error } = await supabase
    .from('vendors')
    .insert([vendorData])
    .select()
    .single();

  if (error) throw error;
  return data as Vendor;
};

export const updateVendor = async (id: string, updates: Partial<Vendor>): Promise<Vendor> => {
  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Vendor;
};

export const deleteVendor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

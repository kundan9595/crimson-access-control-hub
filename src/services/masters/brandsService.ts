
import { supabase } from '@/integrations/supabase/client';
import { Brand } from './types';

export const fetchBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Brand[];
};

export const createBrand = async (brandData: Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Brand> => {
  const { data, error } = await supabase
    .from('brands')
    .insert([brandData])
    .select()
    .single();

  if (error) throw error;
  return data as Brand;
};

export const updateBrand = async (id: string, updates: Partial<Brand>): Promise<Brand> => {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Brand;
};

export const deleteBrand = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

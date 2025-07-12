
import { supabase } from '@/integrations/supabase/client';
import { Fabric } from './types';

export const fetchFabrics = async (): Promise<Fabric[]> => {
  const { data, error } = await supabase
    .from('fabrics')
    .select(`
      *,
      colors (
        id,
        name,
        hex_code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Fabric[];
};

export const createFabric = async (fabricData: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Fabric> => {
  const { data, error } = await supabase
    .from('fabrics')
    .insert([fabricData])
    .select(`
      *,
      colors (
        id,
        name,
        hex_code
      )
    `)
    .single();

  if (error) throw error;
  return data as Fabric;
};

export const updateFabric = async (id: string, updates: Partial<Fabric>): Promise<Fabric> => {
  const { data, error } = await supabase
    .from('fabrics')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      colors (
        id,
        name,
        hex_code
      )
    `)
    .single();

  if (error) throw error;
  return data as Fabric;
};

export const deleteFabric = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('fabrics')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

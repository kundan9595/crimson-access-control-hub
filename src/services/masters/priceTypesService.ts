
import { supabase } from '@/integrations/supabase/client';
import { PriceType } from './types';

export const fetchPriceTypes = async (): Promise<PriceType[]> => {
  const { data, error } = await supabase
    .from('price_types')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as PriceType[];
};

export const createPriceType = async (priceTypeData: Omit<PriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .insert([priceTypeData])
    .select()
    .single();

  if (error) throw error;
  return data as PriceType;
};

export const updatePriceType = async (id: string, updates: Partial<PriceType>): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PriceType;
};

export const deletePriceType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('price_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

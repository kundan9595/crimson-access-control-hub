
import { supabase } from '@/integrations/supabase/client';
import { PriceType, PriceTypeCategory } from './types';

export const fetchPriceTypes = async (): Promise<PriceType[]> => {
  const { data, error } = await supabase
    .from('price_types')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createPriceType = async (priceTypeData: {
  name: string;
  description?: string;
  category: PriceTypeCategory;
  status: string;
}): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .insert([priceTypeData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePriceType = async (id: string, updates: {
  name?: string;
  description?: string;
  category?: PriceTypeCategory;
  status?: string;
}): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePriceType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('price_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

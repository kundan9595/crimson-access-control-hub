
import { supabase } from '@/integrations/supabase/client';
import { PriceType } from './types';

export const fetchPriceTypes = async (distributorId?: string): Promise<PriceType[]> => {
  let query = supabase
    .from('price_types')
    .select('*');

  // Filter by distributor_id if provided
  if (distributorId) {
    query = query.eq('distributor_id', distributorId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createPriceType = async (priceTypeData: {
  name: string;
  description?: string;
  distributor_id: string;
  status: string;
}): Promise<PriceType> => {
  if (!priceTypeData.distributor_id) {
    throw new Error('distributor_id is required when creating a price type');
  }

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
  status?: string;
  distributor_id?: never; // Explicitly prevent distributor_id from being changed
}): Promise<PriceType> => {
  // Explicitly exclude distributor_id from updates - it cannot be changed
  const { distributor_id, ...safeUpdates } = updates as any;
  
  const { data, error } = await supabase
    .from('price_types')
    .update(safeUpdates)
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

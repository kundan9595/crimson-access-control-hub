
import { supabase } from '@/integrations/supabase/client';
import { Sku } from './types';

export const fetchSkus = async (): Promise<Sku[]> => {
  const { data, error } = await supabase
    .from('skus')
    .select(`
      *,
      class:classes(
        *,
        style:styles(
          *,
          brand:brands(*),
          category:categories(*)
        ),
        color:colors(*)
      ),
      size:sizes(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Sku[];
};

export const createSku = async (skuData: Omit<Sku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'class' | 'size'>): Promise<Sku> => {
  const insertData = {
    sku_code: skuData.sku_code,
    class_id: skuData.class_id,
    size_id: skuData.size_id,
    hsn_code: skuData.hsn_code,
    description: skuData.description,
    length_cm: skuData.length_cm,
    breadth_cm: skuData.breadth_cm,
    height_cm: skuData.height_cm,
    weight_grams: skuData.weight_grams,
    base_mrp: skuData.base_mrp,
    cost_price: skuData.cost_price,
    price_type_prices: skuData.price_type_prices,
    status: skuData.status,
  };

  const { data, error } = await supabase
    .from('skus')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data as Sku;
};

export const updateSku = async ({ id, updates }: { id: string; updates: Partial<Sku> }): Promise<Sku> => {
  const { data, error } = await supabase
    .from('skus')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Sku;
};

export const deleteSku = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('skus')
    .delete()
    .eq('id', id);

  if (error) throw error;
};


import { supabase } from '@/integrations/supabase/client';
import { Style } from './types';

export const fetchStyles = async (): Promise<Style[]> => {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Style[];
};

export const createStyle = async (styleData: Omit<Style, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'brand' | 'category'>): Promise<Style> => {
  const { data, error } = await supabase
    .from('styles')
    .insert([styleData])
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .single();

  if (error) throw error;
  return data as Style;
};

export const updateStyle = async (id: string, updates: Partial<Style>): Promise<Style> => {
  const { data, error } = await supabase
    .from('styles')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .single();

  if (error) throw error;
  return data as Style;
};

export const deleteStyle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('styles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const fetchStylesByBrand = async (brandId: string): Promise<Style[]> => {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .eq('brand_id', brandId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Style[];
};

export const fetchStylesByCategory = async (categoryId: string): Promise<Style[]> => {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Style[];
};

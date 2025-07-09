
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Brand = Tables<'brands'>;
export type Category = Tables<'categories'>;
export type Color = Tables<'colors'>;

// Brand services
export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Category services
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Color services
export async function fetchColors(): Promise<Color[]> {
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createColor(color: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Color> {
  const { data, error } = await supabase
    .from('colors')
    .insert(color)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateColor(id: string, updates: Partial<Color>): Promise<Color> {
  const { data, error } = await supabase
    .from('colors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteColor(id: string): Promise<void> {
  const { error } = await supabase
    .from('colors')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

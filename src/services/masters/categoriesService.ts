
import { supabase } from '@/integrations/supabase/client';
import { Category } from './types';

export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Category[];
};

export const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

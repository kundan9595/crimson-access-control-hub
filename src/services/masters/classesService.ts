
import { supabase } from '@/integrations/supabase/client';
import { Class } from './types';

export const fetchClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      style:styles(*),
      color:colors(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Class[];
};

export const createClass = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'style' | 'color'>): Promise<Class> => {
  // Prepare the data for insertion
  const insertData = {
    name: classData.name,
    style_id: classData.style_id,
    color_id: classData.color_id,
    size_group_id: classData.size_group_id,
    selected_sizes: classData.selected_sizes,
    description: classData.description,
    status: classData.status,
    tax_percentage: classData.tax_percentage,
    primary_image_url: classData.primary_image_url,
    images: classData.images,
    size_ratios: classData.size_ratios,
    monthly_stock_levels: classData.monthly_stock_levels,
  };

  const { data, error } = await supabase
    .from('classes')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data as Class;
};

export const updateClass = async (id: string, updates: Partial<Class>): Promise<Class> => {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Class;
};

export const deleteClass = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

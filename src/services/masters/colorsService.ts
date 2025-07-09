
import { supabase } from '@/integrations/supabase/client';
import { Color } from './types';

export const fetchColors = async (): Promise<Color[]> => {
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Color[];
};

export const createColor = async (colorData: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Color> => {
  const { data, error } = await supabase
    .from('colors')
    .insert([colorData])
    .select()
    .single();

  if (error) throw error;
  return data as Color;
};

export const updateColor = async (id: string, updates: Partial<Color>): Promise<Color> => {
  const { data, error } = await supabase
    .from('colors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Color;
};

export const deleteColor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('colors')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

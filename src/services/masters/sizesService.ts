
import { supabase } from '@/integrations/supabase/client';
import { SizeGroup, Size } from './types';

// Size Groups API
export const fetchSizeGroups = async (): Promise<SizeGroup[]> => {
  const { data, error } = await supabase
    .from('size_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SizeGroup[];
};

export const createSizeGroup = async (sizeGroupData: Omit<SizeGroup, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<SizeGroup> => {
  const { data, error } = await supabase
    .from('size_groups')
    .insert([sizeGroupData])
    .select()
    .single();

  if (error) throw error;
  return data as SizeGroup;
};

export const updateSizeGroup = async (id: string, updates: Partial<SizeGroup>): Promise<SizeGroup> => {
  const { data, error } = await supabase
    .from('size_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SizeGroup;
};

export const deleteSizeGroup = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('size_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Sizes API
export const fetchSizes = async (): Promise<Size[]> => {
  const { data, error } = await supabase
    .from('sizes')
    .select(`
      *,
      size_group:size_groups(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Size[];
};

export const createSize = async (sizeData: Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'size_group'>): Promise<Size> => {
  const { data, error } = await supabase
    .from('sizes')
    .insert([sizeData])
    .select()
    .single();

  if (error) throw error;
  return data as Size;
};

export const updateSize = async (id: string, updates: Partial<Size>): Promise<Size> => {
  const { data, error } = await supabase
    .from('sizes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Size;
};

export const deleteSize = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sizes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

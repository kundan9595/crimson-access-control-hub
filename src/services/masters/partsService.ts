
import { supabase } from '@/integrations/supabase/client';

export interface Part {
  id: string;
  name: string;
  selected_add_ons: string[];
  selected_colors: string[];
  order_criteria: boolean;
  sort_position: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const fetchParts = async (): Promise<Part[]> => {
  // Fetching parts from database
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .order('sort_position', { ascending: true });

  if (error) {
    console.error('❌ Error fetching parts:', error);
    throw error;
  }
  
      // Fetched parts successfully
  return (data || []) as Part[];
};

export const createPart = async (partData: Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Part> => {
  // Creating part
  const { data, error } = await supabase
    .from('parts')
    .insert([partData])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating part:', error);
    throw error;
  }
  
      // Created part successfully
  return data as Part;
};

export const updatePart = async (id: string, updates: Partial<Part>): Promise<Part> => {
  // Updating part
  const { data, error } = await supabase
    .from('parts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating part:', error);
    throw error;
  }
  
      // Updated part successfully
  return data as Part;
};

export const deletePart = async (id: string): Promise<void> => {
  // Deleting part
  const { error } = await supabase
    .from('parts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting part:', error);
    throw error;
  }
  
      // Deleted part successfully
};


import { supabase } from '@/integrations/supabase/client';
import { Fabric } from './types';

export const fetchFabrics = async (): Promise<Fabric[]> => {
  const { data, error } = await supabase
    .from('fabrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Fetch colors for each fabric
  const fabricsWithColors = await Promise.all(
    (data || []).map(async (fabric) => {
      if (fabric.color_ids && fabric.color_ids.length > 0) {
        const { data: colorsData } = await supabase
          .from('colors')
          .select('id, name, hex_code')
          .in('id', fabric.color_ids);
        
        return {
          ...fabric,
          colors: colorsData || []
        };
      }
      return {
        ...fabric,
        colors: []
      };
    })
  );
  
  return fabricsWithColors as Fabric[];
};

export const createFabric = async (fabricData: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Fabric> => {
  const { data, error } = await supabase
    .from('fabrics')
    .insert([fabricData])
    .select('*')
    .single();

  if (error) throw error;
  
  // Fetch colors for the created fabric
  let colors = [];
  if (data.color_ids && data.color_ids.length > 0) {
    const { data: colorsData } = await supabase
      .from('colors')
      .select('id, name, hex_code')
      .in('id', data.color_ids);
    
    colors = colorsData || [];
  }
  
  return {
    ...data,
    colors
  } as Fabric;
};

export const updateFabric = async (id: string, updates: Partial<Fabric>): Promise<Fabric> => {
  const { data, error } = await supabase
    .from('fabrics')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  
  // Fetch colors for the updated fabric
  let colors = [];
  if (data.color_ids && data.color_ids.length > 0) {
    const { data: colorsData } = await supabase
      .from('colors')
      .select('id, name, hex_code')
      .in('id', data.color_ids);
    
    colors = colorsData || [];
  }
  
  return {
    ...data,
    colors
  } as Fabric;
};

export const deleteFabric = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('fabrics')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

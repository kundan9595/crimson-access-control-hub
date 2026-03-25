import { supabase } from '@/integrations/supabase/client';
import { Fabric } from './types';
import { fetchColors } from '@/services/masters/colorsService';

export const fetchFabrics = async (): Promise<Fabric[]> => {
  const { data, error } = await supabase
    .from('fabrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Fetch colors for fabrics that have color_ids
  const allColors = await fetchColors();
  const colorMap = new Map(allColors.map((c) => [c.id, c]));

  const fabricsWithColors = (data || []).map((fabric) => {
    if (fabric.color_ids && Array.isArray(fabric.color_ids) && fabric.color_ids.length > 0) {
      const colorsData = fabric.color_ids
        .map((cid: string) => colorMap.get(cid))
        .filter(Boolean)
        .map((c) => ({
          id: c!.id,
          name: c!.name,
          hex_code: c!.hex_code,
        }));
      return { ...fabric, colors: colorsData };
    }
    return { ...fabric, colors: [] };
  });
  
  return fabricsWithColors as Fabric[];
};

export const createFabric = async (fabricData: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>): Promise<Fabric> => {
  const { color_ids, ...fabricDataWithoutColors } = fabricData;
  const { data, error } = await supabase
    .from('fabrics')
    .insert([{ ...fabricDataWithoutColors, color_ids }])
    .select('*')
    .single();

  if (error) throw error;
  
  // Fetch colors if color_ids exist
  let colors: { id: string; name: string; hex_code: string }[] = [];
  if (data.color_ids && Array.isArray(data.color_ids) && data.color_ids.length > 0) {
    const allColors = await fetchColors();
    const set = new Set(data.color_ids as string[]);
    colors = allColors
      .filter((c) => set.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, hex_code: c.hex_code }));
  }
  
  return {
    ...data,
    colors
  } as Fabric;
};

export const updateFabric = async (id: string, updates: Partial<Fabric>): Promise<Fabric> => {
  const { colors, ...updatesWithoutColors } = updates;
  const { data, error } = await supabase
    .from('fabrics')
    .update(updatesWithoutColors)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  
  // Fetch colors if color_ids exist
  let fabricColors: { id: string; name: string; hex_code: string }[] = [];
  if (data.color_ids && Array.isArray(data.color_ids) && data.color_ids.length > 0) {
    const allColors = await fetchColors();
    const set = new Set(data.color_ids as string[]);
    fabricColors = allColors
      .filter((c) => set.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, hex_code: c.hex_code }));
  }
  
  return {
    ...data,
    colors: fabricColors
  } as Fabric;
};

export const deleteFabric = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('fabrics')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

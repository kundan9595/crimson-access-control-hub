
import { supabase } from '@/integrations/supabase/client';
import { Zone, ZoneLocation } from './types';

// Zones API
export const fetchZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      locations:zone_locations(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Zone[];
};

export const createZone = async (zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'locations'>): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .insert([zoneData])
    .select()
    .single();

  if (error) throw error;
  return data as Zone;
};

export const updateZone = async (id: string, updates: Partial<Zone>): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Zone;
};

export const deleteZone = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Zone Locations API
export const createZoneLocation = async (locationData: Omit<ZoneLocation, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ZoneLocation> => {
  const { data, error } = await supabase
    .from('zone_locations')
    .insert([locationData])
    .select()
    .single();

  if (error) throw error;
  return data as ZoneLocation;
};

export const deleteZoneLocation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('zone_locations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { supabase } from '@/integrations/supabase/client';

export interface City {
  id: string;
  name: string;
  state_id: string;
  created_at: string;
}

export const fetchCitiesByState = async (stateId: string): Promise<City[]> => {
  const { data, error } = await supabase
    .from('indian_cities')
    .select('*')
    .eq('state_id', stateId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as City[];
};
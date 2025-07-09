
import { supabase } from '@/integrations/supabase/client';

export type IndianState = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

export type IndianCity = {
  id: string;
  name: string;
  state_id: string;
  created_at: string;
};

export async function fetchStates(): Promise<IndianState[]> {
  const { data, error } = await supabase
    .from('indian_states')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as IndianState[];
}

export async function fetchCitiesByState(stateId: string): Promise<IndianCity[]> {
  const { data, error } = await supabase
    .from('indian_cities')
    .select('*')
    .eq('state_id', stateId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []) as IndianCity[];
}

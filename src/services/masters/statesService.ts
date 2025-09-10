import { supabase } from '@/integrations/supabase/client';

export interface State {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export const fetchStates = async (): Promise<State[]> => {
  const { data, error } = await supabase
    .from('indian_states')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as State[];
};
import { supabase } from '@/integrations/supabase/client';

export interface IndianState {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export const statesService = {
  async getAll(): Promise<IndianState[]> {
    const { data, error } = await supabase
      .from('indian_states')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error fetching states: ${error.message}`);
    }

    return data || [];
  },

  async getById(id: string): Promise<IndianState | null> {
    const { data, error } = await supabase
      .from('indian_states')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching state: ${error.message}`);
    }

    return data;
  }
}; 
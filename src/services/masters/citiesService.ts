import { supabase } from '@/integrations/supabase/client';

export interface IndianCity {
  id: string;
  name: string;
  state_id: string;
  created_at: string;
}

export const citiesService = {
  async getAll(): Promise<IndianCity[]> {
    const { data, error } = await supabase
      .from('indian_cities')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error fetching cities: ${error.message}`);
    }

    return data || [];
  },

  async getByStateId(stateId: string): Promise<IndianCity[]> {
    const { data, error } = await supabase
      .from('indian_cities')
      .select('*')
      .eq('state_id', stateId)
      .order('name');

    if (error) {
      throw new Error(`Error fetching cities for state: ${error.message}`);
    }

    return data || [];
  },

  async getById(id: string): Promise<IndianCity | null> {
    const { data, error } = await supabase
      .from('indian_cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching city: ${error.message}`);
    }

    return data;
  }
}; 
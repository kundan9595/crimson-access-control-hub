
import { supabase } from '@/integrations/supabase/client';

export interface ProfitMargin {
  id: string;
  name: string;
  min_range: number;
  max_range: number;
  margin_percentage: number;
  branding_print: number;
  branding_embroidery: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProfitMarginData {
  name: string;
  min_range: number;
  max_range: number;
  margin_percentage: number;
  branding_print: number;
  branding_embroidery: number;
  status?: string;
}

export interface UpdateProfitMarginData {
  name?: string;
  min_range?: number;
  max_range?: number;
  margin_percentage?: number;
  branding_print?: number;
  branding_embroidery?: number;
  status?: string;
}

export const profitMarginsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profit_margins')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('profit_margins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(profitMarginData: CreateProfitMarginData) {
    const { data, error } = await supabase
      .from('profit_margins')
      .insert([profitMarginData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateProfitMarginData) {
    const { data, error } = await supabase
      .from('profit_margins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { data, error } = await supabase
      .from('profit_margins')
      .update({ status: 'deleted' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkCreate(profitMargins: CreateProfitMarginData[]) {
    const { data, error } = await supabase
      .from('profit_margins')
      .insert(profitMargins)
      .select();

    if (error) throw error;
    return data || [];
  }
};

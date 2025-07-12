
import { supabase } from '@/integrations/supabase/client';

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  select_type: 'single' | 'multiple' | 'checked';
  display_order?: number;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  options?: AddOnOption[];
}

export interface AddOnOption {
  id: string;
  add_on_id: string;
  name: string;
  description?: string;
  price?: number;
  display_order?: number;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const addOnsService = {
  async getAll(): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from('add_ons')
      .select(`
        *,
        options:add_on_options(*)
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive',
      options: item.options?.map((option: any) => ({
        ...option,
        status: option.status as 'active' | 'inactive'
      })) || []
    }));
  },

  async getById(id: string): Promise<AddOn | null> {
    const { data, error } = await supabase
      .from('add_ons')
      .select(`
        *,
        options:add_on_options(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive',
      options: data.options?.map((option: any) => ({
        ...option,
        status: option.status as 'active' | 'inactive'
      })) || []
    } : null;
  },

  async create(addOn: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .insert(addOn)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive'
    };
  },

  async update(id: string, addOn: Partial<AddOn>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .update(addOn)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('add_ons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreate(addOns: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from('add_ons')
      .insert(addOns)
      .select();

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive'
    }));
  },
};

export const addOnOptionsService = {
  async getByAddOnId(addOnId: string): Promise<AddOnOption[]> {
    const { data, error } = await supabase
      .from('add_on_options')
      .select('*')
      .eq('add_on_id', addOnId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'active' | 'inactive'
    }));
  },

  async create(option: Omit<AddOnOption, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AddOnOption> {
    const { data, error } = await supabase
      .from('add_on_options')
      .insert(option)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'active' | 'inactive'
    };
  },

  async update(id: string, option: Partial<AddOnOption>): Promise<AddOnOption> {
    const { data, error } = await supabase
      .from('add_on_options')
      .update(option)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'active' | 'inactive'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('add_on_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreate(options: Omit<AddOnOption, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]): Promise<AddOnOption[]> {
    const { data, error } = await supabase
      .from('add_on_options')
      .insert(options)
      .select();

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'active' | 'inactive'
    }));
  },
};


import { supabase } from '@/integrations/supabase/client';

export interface AddOnOption {
  id: string;
  name: string;
  description?: string;
  price?: number;
  display_order?: number;
  image_url?: string;
  status: 'active' | 'inactive';
}

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  select_type: 'single' | 'multiple' | 'checked';
  options: AddOnOption[];
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
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive',
      options: (item.options as AddOnOption[]) || []
    }));
  },

  async getById(id: string): Promise<AddOn | null> {
    const { data, error } = await supabase
      .from('add_ons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive',
      options: (data.options as AddOnOption[]) || []
    } : null;
  },

  async create(addOn: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .insert({
        ...addOn,
        options: addOn.options || []
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive',
      options: (data.options as AddOnOption[]) || []
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
      status: data.status as 'active' | 'inactive',
      options: (data.options as AddOnOption[]) || []
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
      .insert(addOns.map(addOn => ({
        ...addOn,
        options: addOn.options || []
      })))
      .select();

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive',
      options: (item.options as AddOnOption[]) || []
    }));
  },
};

// Legacy export for backwards compatibility
export const addOnOptionsService = {
  async getByAddOnId(addOnId: string): Promise<AddOnOption[]> {
    const addOn = await addOnsService.getById(addOnId);
    return addOn?.options || [];
  },

  async create(option: Omit<AddOnOption, 'id'> & { add_on_id: string }): Promise<AddOnOption> {
    const { add_on_id, ...optionData } = option;
    const addOn = await addOnsService.getById(add_on_id);
    if (!addOn) throw new Error('Add-on not found');
    
    const newOption = {
      id: crypto.randomUUID(),
      ...optionData,
      status: optionData.status || 'active' as const
    };
    
    const updatedOptions = [...addOn.options, newOption];
    await addOnsService.update(add_on_id, { options: updatedOptions });
    
    return newOption;
  },

  async update(id: string, option: Partial<AddOnOption> & { add_on_id?: string }): Promise<AddOnOption> {
    const { add_on_id, ...optionData } = option;
    if (!add_on_id) throw new Error('add_on_id is required');
    
    const addOn = await addOnsService.getById(add_on_id);
    if (!addOn) throw new Error('Add-on not found');
    
    const updatedOptions = addOn.options.map(opt => 
      opt.id === id ? { ...opt, ...optionData } : opt
    );
    
    await addOnsService.update(add_on_id, { options: updatedOptions });
    
    const updatedOption = updatedOptions.find(opt => opt.id === id);
    if (!updatedOption) throw new Error('Option not found');
    
    return updatedOption;
  },

  async delete(id: string, add_on_id: string): Promise<void> {
    const addOn = await addOnsService.getById(add_on_id);
    if (!addOn) throw new Error('Add-on not found');
    
    const updatedOptions = addOn.options.filter(opt => opt.id !== id);
    await addOnsService.update(add_on_id, { options: updatedOptions });
  },

  async bulkCreate(options: (Omit<AddOnOption, 'id'> & { add_on_id: string })[]): Promise<AddOnOption[]> {
    const results: AddOnOption[] = [];
    
    for (const option of options) {
      const created = await this.create(option);
      results.push(created);
    }
    
    return results;
  },
};

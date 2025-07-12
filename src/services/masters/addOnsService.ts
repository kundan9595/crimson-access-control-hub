
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

export interface AddOnColor {
  id: string;
  name: string;
  hex_code: string;
}

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  select_type: 'single' | 'multiple' | 'checked';
  options: AddOnOption[];
  display_order?: number;
  sort_order?: number;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Updated fields to match new database schema
  add_on_of?: number;
  add_on_sn?: number;
  has_colour?: boolean;
  group_name?: string;
  colors: AddOnColor[];
  price?: number;
}

// Helper function to safely parse options from JSON
const parseOptions = (options: any): AddOnOption[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options as AddOnOption[];
  try {
    const parsed = typeof options === 'string' ? JSON.parse(options) : options;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Helper function to safely parse colors from JSON
const parseColors = (colors: any): AddOnColor[] => {
  if (!colors) return [];
  if (Array.isArray(colors)) return colors as AddOnColor[];
  try {
    const parsed = typeof colors === 'string' ? JSON.parse(colors) : colors;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Helper function to prepare options for database storage
const prepareOptionsForDb = (options: AddOnOption[]): any => {
  return JSON.parse(JSON.stringify(options || []));
};

// Helper function to prepare colors for database storage
const prepareColorsForDb = (colors: AddOnColor[]): any => {
  return JSON.parse(JSON.stringify(colors || []));
};

export const addOnsService = {
  async getAll(): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from('add_ons')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive',
      options: parseOptions(item.options),
      colors: parseColors(item.colors),
      price: item.price ? Number(item.price) : undefined,
      add_on_of: item.add_on_of ? Number(item.add_on_of) : undefined,
      add_on_sn: item.add_on_sn ? Number(item.add_on_sn) : undefined
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
      options: parseOptions(data.options),
      colors: parseColors(data.colors),
      price: data.price ? Number(data.price) : undefined,
      add_on_of: data.add_on_of ? Number(data.add_on_of) : undefined,
      add_on_sn: data.add_on_sn ? Number(data.add_on_sn) : undefined
    } : null;
  },

  async create(addOn: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AddOn> {
    const { data, error } = await supabase
      .from('add_ons')
      .insert({
        ...addOn,
        options: prepareOptionsForDb(addOn.options),
        colors: prepareColorsForDb(addOn.colors)
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive',
      options: parseOptions(data.options),
      colors: parseColors(data.colors),
      price: data.price ? Number(data.price) : undefined,
      add_on_of: data.add_on_of ? Number(data.add_on_of) : undefined,
      add_on_sn: data.add_on_sn ? Number(data.add_on_sn) : undefined
    };
  },

  async update(id: string, addOn: Partial<AddOn>): Promise<AddOn> {
    const updateData: any = { ...addOn };
    if (addOn.options) {
      updateData.options = prepareOptionsForDb(addOn.options);
    }
    if (addOn.colors) {
      updateData.colors = prepareColorsForDb(addOn.colors);
    }

    const { data, error } = await supabase
      .from('add_ons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      select_type: data.select_type as 'single' | 'multiple' | 'checked',
      status: data.status as 'active' | 'inactive',
      options: parseOptions(data.options),
      colors: parseColors(data.colors),
      price: data.price ? Number(data.price) : undefined,
      add_on_of: data.add_on_of ? Number(data.add_on_of) : undefined,
      add_on_sn: data.add_on_sn ? Number(data.add_on_sn) : undefined
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
        options: prepareOptionsForDb(addOn.options),
        colors: prepareColorsForDb(addOn.colors)
      })))
      .select();

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      select_type: item.select_type as 'single' | 'multiple' | 'checked',
      status: item.status as 'active' | 'inactive',
      options: parseOptions(item.options),
      colors: parseColors(item.colors),
      price: item.price ? Number(item.price) : undefined,
      add_on_of: item.add_on_of ? Number(item.add_on_of) : undefined,
      add_on_sn: item.add_on_sn ? Number(item.add_on_sn) : undefined
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

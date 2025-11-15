
import { supabase } from '@/integrations/supabase/client';

export interface BaseProduct {
  id: string;
  name: string;
  sort_order: number;
  calculator?: number;
  category_id?: string;
  fabric_id?: string;
  size_group_ids?: string[];
  parts: string[];
  base_price: number;
  base_sn?: number;
  trims_cost: number;
  adult_consumption: number;
  kids_consumption: number;
  overhead_percentage: number;
  sample_rate: number;
  image_url?: string;
  base_icon_url?: string;
  branding_sides: string[];
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  category?: {
    id: string;
    name: string;
  };
  fabric?: {
    id: string;
    name: string;
    fabric_type: string;
  };
  size_groups?: {
    id: string;
    name: string;
  }[];
}

export const fetchBaseProducts = async (): Promise<BaseProduct[]> => {
  // Fetching base products from database
  const { data, error } = await supabase
    .from('base_products')
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type)
    `)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching base products:', error);
    throw error;
  }
  
      // Fetched base products successfully
  
  const processedData = (data || []).map(item => ({
    ...item,
    calculator: item.calculator ? Number(item.calculator) : undefined,
    base_sn: item.base_sn ? Number(item.base_sn) : undefined,
    parts: Array.isArray(item.parts) ? item.parts : [],
    branding_sides: Array.isArray(item.branding_sides) ? item.branding_sides : [],
    size_group_ids: Array.isArray((item as any).size_group_ids) ? (item as any).size_group_ids : [],
    category: item.category && typeof item.category === 'object' && 'id' in item.category ? item.category : undefined,
    fabric: item.fabric && typeof item.fabric === 'object' && 'id' in item.fabric ? item.fabric : undefined,
  }));
  
  return processedData as BaseProduct[];
};

export const createBaseProduct = async (baseProductData: Omit<BaseProduct, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'fabric' | 'size_group'>): Promise<BaseProduct> => {
  // Creating base product
  
  const insertData = {
    name: baseProductData.name,
    sort_order: baseProductData.sort_order,
    calculator: baseProductData.calculator || null,
    category_id: baseProductData.category_id || null,
    fabric_id: baseProductData.fabric_id || null,
    size_group_ids: baseProductData.size_group_ids || [],
    parts: baseProductData.parts || [],
    base_price: baseProductData.base_price,
    base_sn: baseProductData.base_sn || null,
    trims_cost: baseProductData.trims_cost,
    adult_consumption: baseProductData.adult_consumption,
    kids_consumption: baseProductData.kids_consumption,
    overhead_percentage: baseProductData.overhead_percentage,
    sample_rate: baseProductData.sample_rate,
    image_url: baseProductData.image_url || null,
    base_icon_url: baseProductData.base_icon_url || null,
    branding_sides: baseProductData.branding_sides || [],
    status: baseProductData.status,
  };
  
  const { data, error } = await supabase
    .from('base_products')
    .insert([insertData])
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type)
    `)
    .single();

  if (error) {
    console.error('❌ Error creating base product:', error);
    throw error;
  }
  
      // Created base product successfully
  
  const processedData = {
    ...data,
    calculator: data.calculator ? Number(data.calculator) : undefined,
    base_sn: data.base_sn ? Number(data.base_sn) : undefined,
    parts: Array.isArray(data.parts) ? data.parts : [],
    branding_sides: Array.isArray(data.branding_sides) ? data.branding_sides : [],
    size_group_ids: Array.isArray(data.size_group_ids) ? data.size_group_ids : [],
    category: data.category && typeof data.category === 'object' && 'id' in data.category ? data.category : undefined,
    fabric: data.fabric && typeof data.fabric === 'object' && 'id' in data.fabric ? data.fabric : undefined,
  };
  
  return processedData as BaseProduct;
};

export const updateBaseProduct = async (id: string, updates: Partial<BaseProduct>): Promise<BaseProduct> => {
  // Updating base product
  
  const updateData = {
    name: updates.name,
    sort_order: updates.sort_order,
    calculator: updates.calculator || null,
    category_id: updates.category_id || null,
    fabric_id: updates.fabric_id || null,
    size_group_ids: updates.size_group_ids || [],
    parts: updates.parts || [],
    base_price: updates.base_price,
    base_sn: updates.base_sn || null,
    trims_cost: updates.trims_cost,
    adult_consumption: updates.adult_consumption,
    kids_consumption: updates.kids_consumption,
    overhead_percentage: updates.overhead_percentage,
    sample_rate: updates.sample_rate,
    image_url: updates.image_url || null,
    base_icon_url: updates.base_icon_url || null,
    branding_sides: updates.branding_sides || [],
    status: updates.status,
  };
  
  const { data, error } = await supabase
    .from('base_products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type)
    `)
    .single();

  if (error) {
    console.error('❌ Error updating base product:', error);
    throw error;
  }
  
      // Updated base product successfully
  
  const processedData = {
    ...data,
    calculator: data.calculator ? Number(data.calculator) : undefined,
    base_sn: data.base_sn ? Number(data.base_sn) : undefined,
    parts: Array.isArray(data.parts) ? data.parts : [],
    branding_sides: Array.isArray(data.branding_sides) ? data.branding_sides : [],
    size_group_ids: Array.isArray(data.size_group_ids) ? data.size_group_ids : [],
    category: data.category && typeof data.category === 'object' && 'id' in data.category ? data.category : undefined,
    fabric: data.fabric && typeof data.fabric === 'object' && 'id' in data.fabric ? data.fabric : undefined,
  };
  
  return processedData as BaseProduct;
};

export const deleteBaseProduct = async (id: string): Promise<void> => {
  // Deleting base product
  const { error } = await supabase
    .from('base_products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting base product:', error);
    throw error;
  }
  
      // Deleted base product successfully
};

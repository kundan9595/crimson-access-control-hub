
import { supabase } from '@/integrations/supabase/client';

export interface BaseProduct {
  id: string;
  name: string;
  sort_order: number;
  calculator?: number; // Changed from number to match database
  category_id?: string;
  fabric_id?: string;
  size_group_id?: string; // Added missing field
  parts: string[]; // Array of part IDs
  base_price: number;
  base_sn?: number;
  trims_cost: number;
  adult_consumption: number;
  kids_consumption: number;
  overhead_percentage: number;
  sample_rate: number;
  image_url?: string;
  branding_sides: any[]; // Array of branding side objects
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
  size_group?: {
    id: string;
    name: string;
  };
}

export const fetchBaseProducts = async (): Promise<BaseProduct[]> => {
  console.log('🔍 Fetching base products from database');
  const { data, error } = await supabase
    .from('base_products')
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type),
      size_group:size_groups(id, name)
    `)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching base products:', error);
    throw error;
  }
  
  console.log('✅ Fetched base products:', data);
  // Convert calculator from string to number if it exists
  const processedData = (data || []).map(item => ({
    ...item,
    calculator: item.calculator ? Number(item.calculator) : undefined,
    parts: item.parts || [],
    branding_sides: item.branding_sides || []
  }));
  
  return processedData as BaseProduct[];
};

export const createBaseProduct = async (baseProductData: Omit<BaseProduct, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'fabric' | 'size_group'>): Promise<BaseProduct> => {
  console.log('🆕 Creating base product:', baseProductData);
  
  // Prepare data for insertion, ensuring calculator is handled properly
  const insertData = {
    ...baseProductData,
    calculator: baseProductData.calculator?.toString() || null,
  };
  
  const { data, error } = await supabase
    .from('base_products')
    .insert([insertData])
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type),
      size_group:size_groups(id, name)
    `)
    .single();

  if (error) {
    console.error('❌ Error creating base product:', error);
    throw error;
  }
  
  console.log('✅ Created base product:', data);
  // Convert calculator back to number
  const processedData = {
    ...data,
    calculator: data.calculator ? Number(data.calculator) : undefined,
    parts: data.parts || [],
    branding_sides: data.branding_sides || []
  };
  
  return processedData as BaseProduct;
};

export const updateBaseProduct = async (id: string, updates: Partial<BaseProduct>): Promise<BaseProduct> => {
  console.log('📝 Updating base product:', id, updates);
  
  // Prepare updates, ensuring calculator is handled properly
  const updateData = {
    ...updates,
    calculator: updates.calculator?.toString() || null,
  };
  
  const { data, error } = await supabase
    .from('base_products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name),
      fabric:fabrics(id, name, fabric_type),
      size_group:size_groups(id, name)
    `)
    .single();

  if (error) {
    console.error('❌ Error updating base product:', error);
    throw error;
  }
  
  console.log('✅ Updated base product:', data);
  // Convert calculator back to number
  const processedData = {
    ...data,
    calculator: data.calculator ? Number(data.calculator) : undefined,
    parts: data.parts || [],
    branding_sides: data.branding_sides || []
  };
  
  return processedData as BaseProduct;
};

export const deleteBaseProduct = async (id: string): Promise<void> => {
  console.log('🗑️ Deleting base product:', id);
  const { error } = await supabase
    .from('base_products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error deleting base product:', error);
    throw error;
  }
  
  console.log('✅ Deleted base product:', id);
};

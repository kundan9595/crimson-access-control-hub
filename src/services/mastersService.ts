import { supabase } from '@/lib/supabaseClient';

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SizeGroup {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Size {
  id: string;
  name: string;
  code: string;
  size_group_id: string;
  sort_order: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  size_group?: SizeGroup;
}

export interface ZoneLocation {
  id: string;
  zone_id: string;
  state: string;
  city: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Zone {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: 'active' | 'inactive';
  warehouse_assignments: any[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  locations?: ZoneLocation[];
}

export interface PriceType {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  description: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Style {
  id: string;
  name: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  brand?: Brand;
  category?: Category;
}

// Brands API
export const fetchBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createBrand = async (brandData: Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Brand> => {
  const { data, error } = await supabase
    .from('brands')
    .insert([brandData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBrand = async (id: string, updates: Partial<Brand>): Promise<Brand> => {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBrand = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Categories API
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Colors API
export const fetchColors = async (): Promise<Color[]> => {
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createColor = async (colorData: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Color> => {
  const { data, error } = await supabase
    .from('colors')
    .insert([colorData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateColor = async (id: string, updates: Partial<Color>): Promise<Color> => {
  const { data, error } = await supabase
    .from('colors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteColor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('colors')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Size Groups API
export const fetchSizeGroups = async (): Promise<SizeGroup[]> => {
  const { data, error } = await supabase
    .from('size_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSizeGroup = async (sizeGroupData: Omit<SizeGroup, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<SizeGroup> => {
  const { data, error } = await supabase
    .from('size_groups')
    .insert([sizeGroupData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSizeGroup = async (id: string, updates: Partial<SizeGroup>): Promise<SizeGroup> => {
  const { data, error } = await supabase
    .from('size_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSizeGroup = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('size_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Sizes API
export const fetchSizes = async (): Promise<Size[]> => {
  const { data, error } = await supabase
    .from('sizes')
    .select(`
      *,
      size_group:size_groups(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSize = async (sizeData: Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'size_group'>): Promise<Size> => {
  const { data, error } = await supabase
    .from('sizes')
    .insert([sizeData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSize = async (id: string, updates: Partial<Size>): Promise<Size> => {
  const { data, error } = await supabase
    .from('sizes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSize = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sizes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Zones API
export const fetchZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      locations:zone_locations(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createZone = async (zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'locations'>): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .insert([zoneData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateZone = async (id: string, updates: Partial<Zone>): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteZone = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Zone Locations API
export const createZoneLocation = async (locationData: Omit<ZoneLocation, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ZoneLocation> => {
  const { data, error } = await supabase
    .from('zone_locations')
    .insert([locationData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteZoneLocation = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('zone_locations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Price Types API
export const fetchPriceTypes = async (): Promise<PriceType[]> => {
  const { data, error } = await supabase
    .from('price_types')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createPriceType = async (priceTypeData: Omit<PriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .insert([priceTypeData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePriceType = async (id: string, updates: Partial<PriceType>): Promise<PriceType> => {
  const { data, error } = await supabase
    .from('price_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePriceType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('price_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Vendors API
export const fetchVendors = async (): Promise<Vendor[]> => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Vendor> => {
  const { data, error } = await supabase
    .from('vendors')
    .insert([vendorData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateVendor = async (id: string, updates: Partial<Vendor>): Promise<Vendor> => {
  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteVendor = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Styles API
export const fetchStyles = async (): Promise<Style[]> => {
  const { data, error } = await supabase
    .from('styles')
    .select(`
      *,
      brand:brands(*),
      category:categories(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createStyle = async (styleData: Omit<Style, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'brand' | 'category'>): Promise<Style> => {
  const { data, error } = await supabase
    .from('styles')
    .insert([styleData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStyle = async (id: string, updates: Partial<Style>): Promise<Style> => {
  const { data, error } = await supabase
    .from('styles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStyle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('styles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

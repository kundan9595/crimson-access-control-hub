import { supabase } from '@/integrations/supabase/client';

// Define the types based on the actual database schema
export type Brand = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Color = {
  id: string;
  name: string;
  hex_code: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type SizeGroup = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Size = {
  id: string;
  size_group_id: string;
  name: string;
  code: string;
  sort_order: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type ZoneLocation = {
  id: string;
  zone_id: string;
  state: string;
  city: string;
  created_at: string;
  created_by: string | null;
};

export type Zone = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  warehouse_assignments: any[] | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  locations?: ZoneLocation[];
};

export type PriceType = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type Vendor = {
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
};

// Brand services
export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Brand[];
}

export async function createBrand(brand: Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function updateBrand(id: string, updates: Partial<Brand>): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Category services
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Category[];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Color services
export async function fetchColors(): Promise<Color[]> {
  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Color[];
}

export async function createColor(color: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Color> {
  const { data, error } = await supabase
    .from('colors')
    .insert(color)
    .select()
    .single();
  if (error) throw error;
  return data as Color;
}

export async function updateColor(id: string, updates: Partial<Color>): Promise<Color> {
  const { data, error } = await supabase
    .from('colors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Color;
}

export async function deleteColor(id: string): Promise<void> {
  const { error } = await supabase
    .from('colors')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Size Group services
export async function fetchSizeGroups(): Promise<SizeGroup[]> {
  const { data, error } = await supabase
    .from('size_groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SizeGroup[];
}

export async function createSizeGroup(sizeGroup: Omit<SizeGroup, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<SizeGroup> {
  const { data, error } = await supabase
    .from('size_groups')
    .insert(sizeGroup)
    .select()
    .single();
  if (error) throw error;
  return data as SizeGroup;
}

export async function updateSizeGroup(id: string, updates: Partial<SizeGroup>): Promise<SizeGroup> {
  const { data, error } = await supabase
    .from('size_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as SizeGroup;
}

export async function deleteSizeGroup(id: string): Promise<void> {
  const { error } = await supabase
    .from('size_groups')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Size services
export async function fetchSizes(): Promise<Size[]> {
  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Size[];
}

export async function createSize(size: Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Size> {
  const { data, error } = await supabase
    .from('sizes')
    .insert(size)
    .select()
    .single();
  if (error) throw error;
  return data as Size;
}

export async function updateSize(id: string, updates: Partial<Size>): Promise<Size> {
  const { data, error } = await supabase
    .from('sizes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Size;
}

export async function deleteSize(id: string): Promise<void> {
  const { error } = await supabase
    .from('sizes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Zone Location services
export async function fetchZoneLocations(zoneId: string): Promise<ZoneLocation[]> {
  const { data, error } = await supabase
    .from('zone_locations')
    .select('*')
    .eq('zone_id', zoneId)
    .order('state', { ascending: true });
  if (error) throw error;
  return (data || []) as ZoneLocation[];
}

export async function createZoneLocation(location: Omit<ZoneLocation, 'id' | 'created_at' | 'created_by'>): Promise<ZoneLocation> {
  const { data, error } = await supabase
    .from('zone_locations')
    .insert(location)
    .select()
    .single();
  if (error) throw error;
  return data as ZoneLocation;
}

export async function deleteZoneLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('zone_locations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Zone services
export async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      locations:zone_locations(*)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Zone[];
}

export async function createZone(zone: Omit<Zone, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'locations'>): Promise<Zone> {
  const { data, error } = await supabase
    .from('zones')
    .insert(zone)
    .select()
    .single();
  if (error) throw error;
  return data as Zone;
}

export async function updateZone(id: string, updates: Partial<Zone>): Promise<Zone> {
  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Zone;
}

export async function deleteZone(id: string): Promise<void> {
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Price Type services
export async function fetchPriceTypes(): Promise<PriceType[]> {
  const { data, error } = await supabase
    .from('price_types')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PriceType[];
}

export async function createPriceType(priceType: Omit<PriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<PriceType> {
  const { data, error } = await supabase
    .from('price_types')
    .insert(priceType)
    .select()
    .single();
  if (error) throw error;
  return data as PriceType;
}

export async function updatePriceType(id: string, updates: Partial<PriceType>): Promise<PriceType> {
  const { data, error } = await supabase
    .from('price_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PriceType;
}

export async function deletePriceType(id: string): Promise<void> {
  const { error } = await supabase
    .from('price_types')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Vendor services
export async function fetchVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Vendor[];
}

export async function createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .insert(vendor)
    .select()
    .single();
  if (error) throw error;
  return data as Vendor;
}

export async function updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Vendor;
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

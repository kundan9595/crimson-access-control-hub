
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

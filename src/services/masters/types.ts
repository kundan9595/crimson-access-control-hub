export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SizeGroup {
  id: string;
  name: string;
  description: string | null;
  status: string;
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
  status: string;
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
  status: string;
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
  status: string;
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
  status: string;
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
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  brand?: Brand;
  category?: Category;
}

export interface Class {
  id: string;
  name: string;
  style_id: string | null;
  color_id: string | null;
  size_group_id: string | null;
  selected_sizes: string[] | null;
  description: string | null;
  status: string;
  tax_percentage: number | null;
  primary_image_url: string | null;
  images: string[] | null;
  size_ratios: Record<string, number> | null;
  stock_management_type: 'overall' | 'monthly' | null;
  overall_min_stock: number | null;
  overall_max_stock: number | null;
  monthly_stock_levels: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  style?: Style;
  color?: Color;
}

export interface Sku {
  id: string;
  sku_code: string;
  class_id: string;
  size_id: string;
  hsn_code: string | null;
  description: string | null;
  length_cm: number | null;
  breadth_cm: number | null;
  height_cm: number | null;
  weight_grams: number | null;
  base_mrp: number | null;
  cost_price: number | null;
  price_type_prices: any | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  class?: Class;
  size?: Size;
}

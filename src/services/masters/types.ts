
export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  brand?: Brand;
  category?: Category;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  style_id?: string;
  color_id?: string;
  size_group_id?: string;
  selected_sizes?: any[];
  size_ratios?: Record<string, number>;
  monthly_stock_levels?: Record<string, any>;
  overall_min_stock?: number;
  overall_max_stock?: number;
  stock_management_type?: 'overall' | 'monthly';
  gst_rate?: number;
  images?: any[];
  primary_image_url?: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  style?: Style;
  color?: Color;
}

export interface Size {
  id: string;
  name: string;
  code: string;
  size_group_id: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SizeGroup {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  sizes?: Size[];
}

export interface Sku {
  id: string;
  sku_code: string;
  class_id: string;
  size_id: string;
  description?: string;
  base_mrp?: number;
  cost_price?: number;
  gst_rate?: number;
  hsn_code?: string;
  price_type_prices?: Record<string, number>;
  length_cm?: number;
  breadth_cm?: number;
  height_cm?: number;
  weight_grams?: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relation fields
  class?: Class;
  size?: Size;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  credit_terms?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type PriceTypeCategory = 'zone' | 'customer';

export interface PriceType {
  id: string;
  name: string;
  description?: string;
  category: PriceTypeCategory;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface ZoneLocation {
  id: string;
  zone_id: string;
  state: string;
  city: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Zone {
  id: string;
  name: string;
  status: string;
  warehouse_assignments?: any[];
  locations?: ZoneLocation[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  path: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  original_name: string;
  file_url: string;
  folder_id?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags?: string[];
  usage_count?: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Fabric {
  id: string;
  name: string;
  fabric_type: 'Cotton' | 'Poly Cotton' | 'Polyester';
  gsm: number;
  uom: 'kg' | 'meter';
  price: number;
  color_id?: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  colors?: {
    id: string;
    name: string;
    hex_code: string;
  };
}

export interface AppAsset {
  id: string;
  name: string;
  dx: number;
  dy: number;
  mirror_dx: number;
  asset_height_resp_to_box: number;
  asset?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

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

export interface BaseProduct {
  id: string;
  name: string;
  sort_order: number;
  calculator?: number;
  category_id?: string;
  fabric_id?: string;
  size_group_id?: string;
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

export type {
  AddOn,
  AddOnOption,
} from './addOnsService';

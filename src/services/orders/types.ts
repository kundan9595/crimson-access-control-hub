export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  price_type_id?: string;
  expected_delivery_date?: string;
  shipment_time?: string;
  payment_mode: 'cash' | 'credit' | 'bank_transfer' | 'cheque';
  order_remarks?: string;
  ship_to_address: CustomerAddress;
  bill_to_address: CustomerAddress;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relations
  customer?: Customer;
  price_type?: PriceType;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'sku' | 'misc';
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  quantity: number;
  price_type_id?: string;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  subtotal: number;
  gst_rate?: number;
  gst_amount?: number;
  created_at: string;
  
  // Relations
  sku?: SKU;
  size?: Size;
  price_type?: PriceType;
}

export interface CustomerAddress {
  id?: string;
  label: string;
  type: 'office' | 'delivery' | 'billing' | 'other';
  address: string;
  city?: {
    id: string;
    name: string;
  };
  state?: {
    id: string;
    name: string;
  };
  postal_code: string;
  is_primary?: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  price_type_id?: string;
  gst?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  price_type?: PriceType;
  addresses?: CustomerAddress[];
}

export interface SKU {
  id: string;
  sku_code: string;
  class_id?: string;
  size_id?: string;
  description?: string;
  base_mrp?: number;
  cost_price?: number;
  price_type_prices?: any;
  status: string;
  
  // Relations
  class?: Class;
  size?: Size;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  style_id?: string;
  color_id?: string;
  primary_image_url?: string;
  gst_rate?: number;
  status: string;
  
  // Relations
  style?: Style;
  color?: Color;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
  brand_id?: string;
  category_id?: string;
  
  // Relations
  brand?: Brand;
  category?: Category;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  status: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  status: string;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  status: string;
}

export interface Size {
  id: string;
  name: string;
  code: string;
  size_group_id?: string;
  sort_order?: number;
  status?: string;
}

export interface PriceType {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: string;
}

export interface CreateOrderData {
  customer_id: string;
  price_type_id?: string;
  expected_delivery_date?: string;
  shipment_time?: string;
  payment_mode: 'cash' | 'credit' | 'bank_transfer' | 'cheque';
  order_remarks?: string;
  ship_to_address: CustomerAddress;
  bill_to_address: CustomerAddress;
  items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  item_type: 'sku' | 'misc';
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  quantity: number;
  price_type_id?: string;
  unit_price: number;
  discount_percentage?: number;
  gst_rate?: number;
  gst_amount?: number;
}

export interface OrderFormData {
  // Step 1: Customer and addresses
  customer_id: string;
  ship_to_address: CustomerAddress;
  bill_to_address: CustomerAddress;
  
  // Step 2: Order details
  price_type_id?: string;
  expected_delivery_date?: string;
  shipment_time?: string;
  payment_mode: 'cash' | 'credit' | 'bank_transfer' | 'cheque';
  order_remarks?: string;
  
  // Step 3: Items
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  id: string; // Temporary ID for form management
  item_type: 'sku' | 'misc';
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  quantity: number;
  price_type_id?: string;
  unit_price: number;
  discount_percentage: number;
  subtotal: number;
  gst_rate?: number;
  gst_amount?: number;
  
  // Additional data for display
  sku?: SKU;
  size?: Size;
  price_type?: PriceType;
}
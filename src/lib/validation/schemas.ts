import * as z from 'zod';

// Base entity schema that most entities share
export const createBaseEntitySchema = (entityName: string) => z.object({
  name: z.string().min(1, `${entityName} name is required`).max(255, 'Name is too long'),
  status: z.enum(['active', 'inactive']).default('active'),
  sort_order: z.number().min(0).default(0),
});

// Master entity schema with common fields
export const createMasterEntitySchema = (entityName: string) => 
  createBaseEntitySchema(entityName).extend({
    description: z.string().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
  });

// Common field schemas for reuse
export const commonFields = {
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  sort_order: z.number().min(0).default(0),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex code (e.g., #FF0000)'),
  price: z.number().min(0, 'Price must be non-negative'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  code: z.string().min(1, 'Code is required'),
  hsn_code: z.string().optional(),
  gst_rate: z.number().min(0).max(100).optional(),
  length_cm: z.number().min(0).optional(),
  breadth_cm: z.number().min(0).optional(),
  height_cm: z.number().min(0).optional(),
  weight_grams: z.number().min(0).optional(),
} as const;

// Specific entity schemas
export const brandSchema = createMasterEntitySchema('Brand').extend({
  logo_url: z.string().url().optional().or(z.literal('')),
});

export const categorySchema = createMasterEntitySchema('Category').extend({
  parent_id: z.string().optional(),
});

export const colorSchema = z.object({
  name: commonFields.name,
  hex_code: commonFields.hex_code,
  status: commonFields.status,
});

export const styleSchema = createMasterEntitySchema('Style').extend({
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
});

export const sizeGroupSchema = createMasterEntitySchema('Size Group');

export const sizeSchema = z.object({
  name: commonFields.name,
  code: commonFields.code,
  size_group_id: z.string().min(1, 'Size group is required'),
  status: commonFields.status,
  sort_order: commonFields.sort_order,
});

export const vendorSchema = z.object({
  name: commonFields.name,
  code: commonFields.code,
  description: commonFields.description,
  contact_person: z.string().optional(),
  email: commonFields.email,
  phone: commonFields.phone,
  address: commonFields.address,
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  tax_id: z.string().optional(),
  credit_terms: z.string().optional(),
  style_specializations: z.array(z.string()).default([]),
  status: commonFields.status,
});

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Address label is required').max(100, 'Address label is too long'),
  type: z.enum(['office', 'delivery', 'billing', 'other']),
  address: z.string().min(1, 'Address is required').max(500, 'Address is too long'),
  city_id: z.string().min(1, 'City is required'),
  state_id: z.string().min(1, 'State is required'),
  postal_code: z.string().regex(/^[0-9]{6}$/, 'Postal code must be 6 digits'),
  is_primary: z.boolean().default(false),
});

export const customerSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required').max(50, 'Customer code is too long'),
  company_name: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  contact_person: z.string().min(1, 'Contact person is required').max(255, 'Contact person name is too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, 'Invalid phone number format'),
  price_type_id: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  credit_limit: z.number().min(0, 'Credit limit must be non-negative').default(0),
  payment_terms: z.string().max(255, 'Payment terms is too long').optional(),
  gst: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, 'Invalid GST format (e.g., 27AABCU9603R1ZX)').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  addresses: z.array(addressSchema).min(1, 'At least one address is required'),
});

export const priceTypeSchema = z.object({
  name: commonFields.name,
  description: commonFields.description,
  category: z.enum(['zone', 'customer']),
  status: commonFields.status,
});

export const zoneSchema = z.object({
  name: commonFields.name,
  status: commonFields.status,
});

export const fabricSchema = z.object({
  name: commonFields.name,
  fabric_type: z.enum(['Cotton', 'Poly Cotton', 'Polyester']),
  gsm: z.number().min(0, 'GSM must be non-negative'),
  uom: z.enum(['kg', 'meter']),
  price: commonFields.price,
  color_ids: z.array(z.string()).default([]),
  image_url: commonFields.image_url,
  status: commonFields.status,
});

export const partSchema = createMasterEntitySchema('Part');

export const addOnSchema = z.object({
  name: commonFields.name,
  select_type: z.enum(['single', 'multiple', 'checked'], {
    required_error: 'Select type is required',
  }),
  sort_order: commonFields.sort_order,
  image_url: commonFields.image_url,
  status: commonFields.status,
  add_on_of: z.number().min(0).optional(),
  add_on_sn: z.number().min(0).optional(),
  has_colour: z.boolean().default(false),
  group_name: z.string().optional(),
  price: commonFields.price.optional(),
  selected_color_ids: z.array(z.string()).default([]),
});

export const baseProductSchema = z.object({
  name: commonFields.name,
  sort_order: commonFields.sort_order,
  calculator: z.number().min(0).default(0),
  category_id: z.string().optional(),
  fabric_id: z.string().optional(),
  size_group_ids: z.array(z.string()).default([]),
  parts: z.array(z.string()).default([]),
  base_price: commonFields.price,
  base_sn: z.number().min(0).optional(),
  trims_cost: commonFields.price,
  adult_consumption: z.number().min(0).default(0),
  kids_consumption: z.number().min(0).default(0),
  overhead_percentage: commonFields.percentage,
  sample_rate: z.number().min(0).default(0),
  image_url: commonFields.image_url,
  base_icon_url: z.string().optional(),
  branding_sides: z.array(z.string()).default([]),
  status: commonFields.status,
});

export const classSchema = z.object({
  name: commonFields.name,
  description: commonFields.description,
  style_id: z.string().optional(),
  color_id: z.string().optional(),
  size_group_id: z.string().optional(),
  selected_sizes: z.array(z.string()).default([]),
  size_ratios: z.record(z.string(), z.number()).default({}),
  monthly_stock_levels: z.record(z.string(), z.any()).default({}),
  overall_min_stock: z.number().min(0).default(0),
  overall_max_stock: z.number().min(0).default(0),
  stock_management_type: z.enum(['overall', 'monthly']).default('overall'),
  gst_rate: commonFields.gst_rate,
  images: z.array(z.string()).default([]),
  primary_image_url: z.string().optional(),
  status: commonFields.status,
  sort_order: commonFields.sort_order,
});

export const skuSchema = z.object({
  sku_code: commonFields.code,
  class_id: z.string().min(1, 'Class is required'),
  size_id: z.string().min(1, 'Size is required'),
  hsn_code: commonFields.hsn_code,
  description: commonFields.description,
  length_cm: commonFields.length_cm,
  breadth_cm: commonFields.breadth_cm,
  height_cm: commonFields.height_cm,
  weight_grams: commonFields.weight_grams,
  base_mrp: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  gst_rate: commonFields.gst_rate,
  selected_price_types: z.array(z.string()).default([]),
  price_type_prices: z.record(z.string(), z.number()).default({}),
  status: commonFields.status,
});

export const profitMarginSchema = z.object({
  name: commonFields.name,
  min_range: z.number().min(0, 'Minimum range must be non-negative'),
  max_range: z.number().min(0, 'Maximum range must be non-negative'),
  margin_percentage: commonFields.percentage,
  branding_print: z.number().min(0).default(0),
  branding_embroidery: z.number().min(0).default(0),
  status: commonFields.status,
});

export const appAssetSchema = z.object({
  name: commonFields.name,
  dx: z.number(),
  dy: z.number(),
  mirror_dx: z.number(),
  asset_height_resp_to_box: z.number(),
  asset: z.string().optional(),
  add_on_id: z.string().optional(),
  status: commonFields.status,
});

export const promotionalBannerSchema = z.object({
  title: commonFields.name,
  banner_image: z.string().optional(),
  status: commonFields.status,
  position: z.number().min(0),
  category_id: z.string().optional(),
  brand_id: z.string().min(1, 'Brand is required'),
  class_id: z.string().optional(),
});

export const promotionalAssetSchema = z.object({
  name: commonFields.name,
  thumbnail: z.string().optional(),
  link: z.string().optional(),
  type: z.enum(['Video', 'Catalogue', 'Lifestyle Images', 'Images']),
  status: commonFields.status,
});

// Export all schemas for easy access
export const schemas = {
  brand: brandSchema,
  category: categorySchema,
  color: colorSchema,
  style: styleSchema,
  sizeGroup: sizeGroupSchema,
  size: sizeSchema,
  vendor: vendorSchema,
  customer: customerSchema,
  priceType: priceTypeSchema,
  zone: zoneSchema,
  fabric: fabricSchema,
  part: partSchema,
  addOn: addOnSchema,
  baseProduct: baseProductSchema,
  class: classSchema,
  sku: skuSchema,
  profitMargin: profitMarginSchema,
  appAsset: appAssetSchema,
  promotionalBanner: promotionalBannerSchema,
  promotionalAsset: promotionalAssetSchema,
} as const;

// Type exports for use in components
export type BrandFormData = z.infer<typeof brandSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ColorFormData = z.infer<typeof colorSchema>;
export type StyleFormData = z.infer<typeof styleSchema>;
export type SizeGroupFormData = z.infer<typeof sizeGroupSchema>;
export type SizeFormData = z.infer<typeof sizeSchema>;
export type VendorFormData = z.infer<typeof vendorSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type PriceTypeFormData = z.infer<typeof priceTypeSchema>;
export type ZoneFormData = z.infer<typeof zoneSchema>;
export type FabricFormData = z.infer<typeof fabricSchema>;
export type PartFormData = z.infer<typeof partSchema>;
export type AddOnFormData = z.infer<typeof addOnSchema>;
export type BaseProductFormData = z.infer<typeof baseProductSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type SkuFormData = z.infer<typeof skuSchema>;
export type ProfitMarginFormData = z.infer<typeof profitMarginSchema>;
export type AppAssetFormData = z.infer<typeof appAssetSchema>;
export type PromotionalBannerFormData = z.infer<typeof promotionalBannerSchema>;
export type PromotionalAssetFormData = z.infer<typeof promotionalAssetSchema>;

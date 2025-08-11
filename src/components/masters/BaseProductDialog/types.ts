import * as z from 'zod';
import { BaseProduct } from '@/services/masters/baseProductsService';

// Form schema
export const baseProductFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.number().min(0).default(0),
  calculator: z.number().min(0).default(0),
  category_id: z.string().optional(),
  fabric_id: z.string().optional(),
  size_group_ids: z.array(z.string()).default([]),
  parts: z.array(z.string()).default([]),
  base_price: z.number().min(0).default(0),
  base_sn: z.number().min(0).optional(),
  trims_cost: z.number().min(0).default(0),
  adult_consumption: z.number().min(0).default(0),
  kids_consumption: z.number().min(0).default(0),
  overhead_percentage: z.number().min(0).max(100).default(0),
  sample_rate: z.number().min(0).default(0),
  image_url: z.string().optional(),
  base_icon_url: z.string().optional(),
  branding_sides: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type BaseProductFormData = z.infer<typeof baseProductFormSchema>;

// Main dialog props
export interface BaseProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseProduct?: BaseProduct;
}

// Tab types
export type BaseProductTab = 'basic' | 'categories' | 'pricing' | 'consumption' | 'media';

// Step component props
export interface BaseProductStepProps {
  form: any; // UseFormReturn<BaseProductFormData>
  categories: any[];
  fabrics: any[];
  parts: any[];
  sizeGroups: any[];
}

// Branding side options
export const BRANDING_SIDE_OPTIONS = [
  'Front Side',
  'Back Side',
  'Left Sleeves',
  'Right Sleeves',
  'Inner Label'
] as const;

export type BrandingSide = typeof BRANDING_SIDE_OPTIONS[number];

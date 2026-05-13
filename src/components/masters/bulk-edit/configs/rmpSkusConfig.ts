import type { BulkEditColumn } from '../types';
import type { RmpSku } from '@/services/masters/rmpSkusService';

export interface RmpSkuCreatePayload {
  name: string;
  cgst: number;
  igst: number;
  sgst: number;
  status: string;
  is_deleted: boolean;
  rmp_size_id?: string;
  rmp_class_id?: string;
  rmp_brand_id?: string;
  rmp_category_id?: string;
}

export interface RmpSkuUpdatePayload {
  name?: string;
  cgst?: number;
  igst?: number;
  sgst?: number;
  status?: string;
  is_deleted?: boolean;
  rmp_size_id?: string;
  rmp_class_id?: string;
  rmp_brand_id?: string;
  rmp_category_id?: string;
}

export interface RmpSkusColumnsContext {
  rmpSizeOptions: { value: string; label: string }[];
  rmpClassOptions: { value: string; label: string }[];
  rmpBrandOptions: { value: string; label: string }[];
  rmpCategoryOptions: { value: string; label: string }[];
}

export const buildRmpSkusColumns = ({
  rmpSizeOptions,
  rmpClassOptions,
  rmpBrandOptions,
  rmpCategoryOptions,
}: RmpSkusColumnsContext): BulkEditColumn<RmpSku>[] => [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'cgst',
    name: 'CGST',
    type: 'decimal',
    min: 0,
    max: 100,
    width: 100,
  },
  {
    key: 'igst',
    name: 'IGST',
    type: 'decimal',
    min: 0,
    max: 100,
    width: 100,
  },
  {
    key: 'sgst',
    name: 'SGST',
    type: 'decimal',
    min: 0,
    max: 100,
    width: 100,
  },
  {
    key: 'rmp_size_id',
    name: 'Size',
    type: 'enum',
    width: 180,
    nullable: true,
    emptyLabel: 'None',
    options: rmpSizeOptions,
    editorOptions: rmpSizeOptions,
  },
  {
    key: 'rmp_class_id',
    name: 'Class',
    type: 'enum',
    width: 180,
    nullable: true,
    emptyLabel: 'None',
    options: rmpClassOptions,
    editorOptions: rmpClassOptions,
  },
  {
    key: 'rmp_brand_id',
    name: 'Brand',
    type: 'enum',
    width: 180,
    nullable: true,
    emptyLabel: 'None',
    options: rmpBrandOptions,
    editorOptions: rmpBrandOptions,
  },
  {
    key: 'rmp_category_id',
    name: 'Category',
    type: 'enum',
    width: 180,
    nullable: true,
    emptyLabel: 'None',
    options: rmpCategoryOptions,
    editorOptions: rmpCategoryOptions,
  },
  {
    key: 'status',
    name: 'Status',
    type: 'enum',
    width: 100,
    required: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

export const rmpSkusGetRowId = (row: RmpSku): string => row.id;

export const rmpSkusCreateEmptyRow = (): RmpSku => ({
  id: '',
  name: '',
  cgst: 0,
  igst: 0,
  sgst: 0,
  is_deleted: false,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const rmpSkusToCreatePayload = (row: RmpSku): RmpSkuCreatePayload => ({
  name: row.name,
  cgst: Number(row.cgst) || 0,
  igst: Number(row.igst) || 0,
  sgst: Number(row.sgst) || 0,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_size_id: row.rmp_size_id || undefined,
  rmp_class_id: row.rmp_class_id || undefined,
  rmp_brand_id: row.rmp_brand_id || undefined,
  rmp_category_id: row.rmp_category_id || undefined,
});

export const rmpSkusToUpdatePayload = (row: RmpSku): RmpSkuUpdatePayload => ({
  name: row.name,
  cgst: Number(row.cgst) || 0,
  igst: Number(row.igst) || 0,
  sgst: Number(row.sgst) || 0,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_size_id: row.rmp_size_id || undefined,
  rmp_class_id: row.rmp_class_id || undefined,
  rmp_brand_id: row.rmp_brand_id || undefined,
  rmp_category_id: row.rmp_category_id || undefined,
});

export const rmpSkusQueryKey = ['rmp_skus'];

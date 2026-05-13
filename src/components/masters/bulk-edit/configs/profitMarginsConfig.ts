import type { BulkEditColumn, BulkEditConfig } from '../types';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';

export interface ProfitMarginCreatePayload {
  name: string;
  min_range: number;
  max_range: number;
  margin_percentage: number;
  branding_print: number;
  branding_embroidery: number;
  status: string;
}

export interface ProfitMarginUpdatePayload {
  name?: string;
  min_range?: number;
  max_range?: number;
  margin_percentage?: number;
  branding_print?: number;
  branding_embroidery?: number;
  status?: string;
}

export const profitMarginsColumns: BulkEditColumn<ProfitMargin>[] = [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'min_range',
    name: 'Min Range',
    type: 'decimal',
    min: 0,
    width: 100,
  },
  {
    key: 'max_range',
    name: 'Max Range',
    type: 'decimal',
    min: 0,
    width: 100,
  },
  {
    key: 'margin_percentage',
    name: 'Margin %',
    type: 'decimal',
    min: 0,
    max: 100,
    width: 100,
  },
  {
    key: 'branding_print',
    name: 'Branding Print',
    type: 'decimal',
    min: 0,
    width: 120,
  },
  {
    key: 'branding_embroidery',
    name: 'Branding Embroidery',
    type: 'decimal',
    min: 0,
    width: 140,
  },
  {
    key: 'status',
    name: 'Status',
    type: 'enum',
    width: 100,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

export const profitMarginsGetRowId = (row: ProfitMargin): string => row.id;

export const profitMarginsCreateEmptyRow = (): ProfitMargin => ({
  id: '',
  name: '',
  min_range: 0,
  max_range: 0,
  margin_percentage: 0,
  branding_print: 0,
  branding_embroidery: 0,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const profitMarginsToCreatePayload = (row: ProfitMargin): ProfitMarginCreatePayload => ({
  name: row.name,
  min_range: row.min_range,
  max_range: row.max_range,
  margin_percentage: row.margin_percentage,
  branding_print: row.branding_print,
  branding_embroidery: row.branding_embroidery,
  status: row.status,
});

export const profitMarginsToUpdatePayload = (row: ProfitMargin): ProfitMarginUpdatePayload => ({
  name: row.name,
  min_range: row.min_range,
  max_range: row.max_range,
  margin_percentage: row.margin_percentage,
  branding_print: row.branding_print,
  branding_embroidery: row.branding_embroidery,
  status: row.status,
});

export const profitMarginsQueryKey = ['profit_margins'];

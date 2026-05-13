import type { BulkEditColumn, BulkEditConfig } from '../types';
import type { Part } from '@/services/masters/partsServiceScott';

export interface ScottPartCreatePayload {
  name: string;
  sort_position: number;
  order_criteria: boolean;
  status: string;
}

export interface ScottPartUpdatePayload {
  name?: string;
  sort_position?: number;
  order_criteria?: boolean;
  status?: string;
}

export const scottPartsColumns: BulkEditColumn<Part>[] = [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 250,
  },
  {
    key: 'sort_position',
    name: 'Sort Position',
    type: 'integer',
    min: 0,
    width: 120,
  },
  {
    key: 'order_criteria',
    name: 'Order Criteria',
    type: 'boolean',
    width: 120,
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

export const scottPartsGetRowId = (row: Part): string => row.id;

export const scottPartsCreateEmptyRow = (): Part => ({
  id: '',
  name: '',
  sort_position: 0,
  order_criteria: false,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const scottPartsToCreatePayload = (row: Part): ScottPartCreatePayload => ({
  name: row.name,
  sort_position: row.sort_position,
  order_criteria: row.order_criteria,
  status: row.status,
});

export const scottPartsToUpdatePayload = (row: Part): ScottPartUpdatePayload => ({
  name: row.name,
  sort_position: row.sort_position,
  order_criteria: row.order_criteria,
  status: row.status,
});

export const scottPartsQueryKey = ['parts'];

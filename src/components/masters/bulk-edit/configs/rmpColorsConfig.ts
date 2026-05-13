import type { BulkEditColumn, BulkEditConfig } from '../types';
import type { RmpColor } from '@/services/masters/rmpColorsService';

export interface RmpColorCreatePayload {
  name: string;
  code: string;
  status: string;
  is_deleted: boolean;
}

export interface RmpColorUpdatePayload {
  name?: string;
  code?: string;
  status?: string;
  is_deleted?: boolean;
}

export const rmpColorsColumns: BulkEditColumn<RmpColor>[] = [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'code',
    name: 'Hex Code',
    type: 'hex',
    required: true,
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

export const rmpColorsGetRowId = (row: RmpColor): string => row.id;

export const rmpColorsCreateEmptyRow = (): RmpColor => ({
  id: '',
  name: '',
  code: '#000000',
  is_deleted: false,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const rmpColorsToCreatePayload = (row: RmpColor): RmpColorCreatePayload => ({
  name: row.name,
  code: row.code,
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpColorsToUpdatePayload = (row: RmpColor): RmpColorUpdatePayload => ({
  name: row.name,
  code: row.code,
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpColorsQueryKey = ['rmp_colors'];

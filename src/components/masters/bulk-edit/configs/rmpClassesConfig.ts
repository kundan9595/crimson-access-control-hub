import type { BulkEditColumn } from '../types';
import type { RmpClass } from '@/services/masters/rmpClassesService';

export interface RmpClassCreatePayload {
  name: string;
  position: number;
  status: string;
  is_deleted: boolean;
  rmp_color_id?: string;
}

export interface RmpClassUpdatePayload {
  name?: string;
  position?: number;
  status?: string;
  is_deleted?: boolean;
  rmp_color_id?: string;
}

export interface RmpClassesColumnsContext {
  rmpColorOptions: { value: string; label: string }[];
}

export const buildRmpClassesColumns = ({
  rmpColorOptions,
}: RmpClassesColumnsContext): BulkEditColumn<RmpClass>[] => [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'position',
    name: 'Position',
    type: 'integer',
    min: 0,
    width: 100,
  },
  {
    key: 'rmp_color_id',
    name: 'Color',
    type: 'enum',
    width: 180,
    nullable: true,
    emptyLabel: 'None',
    options: rmpColorOptions,
    editorOptions: rmpColorOptions,
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

export const rmpClassesGetRowId = (row: RmpClass): string => row.id;

export const rmpClassesCreateEmptyRow = (): RmpClass => ({
  id: '',
  name: '',
  position: 0,
  is_deleted: false,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const rmpClassesToCreatePayload = (row: RmpClass): RmpClassCreatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_color_id: row.rmp_color_id || undefined,
});

export const rmpClassesToUpdatePayload = (row: RmpClass): RmpClassUpdatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_color_id: row.rmp_color_id || undefined,
});

export const rmpClassesQueryKey = ['rmp_classes'];

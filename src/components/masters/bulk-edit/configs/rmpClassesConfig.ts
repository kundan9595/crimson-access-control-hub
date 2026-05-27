import type { BulkEditColumn } from '../types';
import type { RmpClass, RmpClassImageFiles } from '@/services/masters/rmpClassesService';
import { RMP_CLASS_IMAGE_SLOTS } from '@/services/masters/rmpClassesService';

export interface RmpClassCreatePayload {
  name: string;
  position: number;
  status: string;
  is_deleted: boolean;
  rmp_color_id?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  image_5?: string;
  imageFiles?: RmpClassImageFiles;
}

export interface RmpClassUpdatePayload {
  name?: string;
  position?: number;
  status?: string;
  is_deleted?: boolean;
  rmp_color_id?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  image_5?: string;
  imageFiles?: RmpClassImageFiles;
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
  ...RMP_CLASS_IMAGE_SLOTS.map((slot, index) => ({
    key: slot,
    name: `Image ${index + 1}`,
    type: 'url' as const,
    width: 220,
  })),
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
  image_1: '',
  image_2: '',
  image_3: '',
  image_4: '',
  image_5: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

function imageUrlsFromRow(row: RmpClass): Pick<RmpClass, 'image_1' | 'image_2' | 'image_3' | 'image_4' | 'image_5'> {
  return {
    image_1: row.image_1?.trim() || undefined,
    image_2: row.image_2?.trim() || undefined,
    image_3: row.image_3?.trim() || undefined,
    image_4: row.image_4?.trim() || undefined,
    image_5: row.image_5?.trim() || undefined,
  };
}

export const rmpClassesToCreatePayload = (row: RmpClass): RmpClassCreatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_color_id: row.rmp_color_id || undefined,
  ...imageUrlsFromRow(row),
});

export const rmpClassesToUpdatePayload = (row: RmpClass): RmpClassUpdatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  rmp_color_id: row.rmp_color_id || undefined,
  ...imageUrlsFromRow(row),
});

export const rmpClassesQueryKey = ['rmp_classes'];

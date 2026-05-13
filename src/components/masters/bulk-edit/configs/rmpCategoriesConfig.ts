import type { BulkEditColumn, BulkEditConfig, ImageValue } from '../types';
import type { RmpCategory } from '@/services/masters/rmpCategoriesService';

export interface RmpCategoryCreatePayload {
  name: string;
  position: number;
  status: string;
  is_deleted: boolean;
  imageFile?: File;
}

export interface RmpCategoryUpdatePayload {
  name?: string;
  position?: number;
  status?: string;
  is_deleted?: boolean;
  imageFile?: File;
}

export const rmpCategoriesColumns: BulkEditColumn<RmpCategory>[] = [
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
    key: 'status',
    name: 'Status',
    type: 'enum',
    width: 100,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'image',
    name: 'Image',
    type: 'image',
    width: 200,
    imageConfig: {
      accept: 'image/*',
      maxSize: 5 * 1024 * 1024, // 5MB
    },
  },
];

export const rmpCategoriesGetRowId = (row: RmpCategory): string => row.id;

export const rmpCategoriesCreateEmptyRow = (): RmpCategory => ({
  id: '',
  name: '',
  position: 0,
  is_deleted: false,
  image: '',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/** Helper to extract the selected File from an image column value. */
function getImageFileFromRow(row: RmpCategory): File | undefined {
  const imageValue = row.image as unknown as ImageValue | undefined;
  return imageValue?.file;
}

export const rmpCategoriesToCreatePayload = (row: RmpCategory): RmpCategoryCreatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpCategoriesToUpdatePayload = (row: RmpCategory): RmpCategoryUpdatePayload => ({
  name: row.name,
  position: row.position,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpCategoriesQueryKey = ['rmp_categories'];

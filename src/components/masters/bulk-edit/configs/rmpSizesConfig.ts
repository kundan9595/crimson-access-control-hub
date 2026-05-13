import type { BulkEditColumn, BulkEditConfig, ImageValue } from '../types';
import type { RmpSize } from '@/services/masters/rmpSizesService';

export interface RmpSizeCreatePayload {
  name: string;
  position: number;
  size_type: 'alpha' | 'numeric' | 'free_size' | 'kids' | 'bags';
  status: string;
  is_deleted: boolean;
  imageFile?: File;
}

export interface RmpSizeUpdatePayload {
  name?: string;
  position?: number;
  size_type?: 'alpha' | 'numeric' | 'free_size' | 'kids' | 'bags';
  status?: string;
  is_deleted?: boolean;
  imageFile?: File;
}

export const rmpSizesColumns: BulkEditColumn<RmpSize>[] = [
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
    key: 'size_type',
    name: 'Size Type',
    type: 'enum',
    required: true,
    width: 120,
    options: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'numeric', label: 'Numeric' },
      { value: 'free_size', label: 'Free Size' },
      { value: 'kids', label: 'Kids' },
      { value: 'bags', label: 'Bags' },
    ],
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

export const rmpSizesGetRowId = (row: RmpSize): string => row.id;

export const rmpSizesCreateEmptyRow = (): RmpSize => ({
  id: '',
  name: '',
  position: 0,
  size_type: 'alpha',
  is_deleted: false,
  image: '',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/** Helper to extract the selected File from an image column value. */
function getImageFileFromRow(row: RmpSize): File | undefined {
  const imageValue = row.image as unknown as ImageValue | undefined;
  return imageValue?.file;
}

export const rmpSizesToCreatePayload = (row: RmpSize): RmpSizeCreatePayload => ({
  name: row.name,
  position: row.position,
  size_type: row.size_type,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpSizesToUpdatePayload = (row: RmpSize): RmpSizeUpdatePayload => ({
  name: row.name,
  position: row.position,
  size_type: row.size_type,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpSizesQueryKey = ['rmp_sizes'];

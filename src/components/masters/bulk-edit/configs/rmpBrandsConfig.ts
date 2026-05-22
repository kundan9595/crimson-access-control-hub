import type { BulkEditColumn, EnumOption, ImageValue } from '../types';
import type { RmpBrand } from '@/services/masters/rmpBrandsService';

export interface RmpBrandCreatePayload {
  name: string;
  position: number;
  authorized_brand_id?: string;
  status: string;
  is_deleted: boolean;
  imageFile?: File;
}

export interface RmpBrandUpdatePayload {
  name?: string;
  position?: string;
  authorized_brand_id?: string;
  status?: string;
  is_deleted?: boolean;
  imageFile?: File;
}

export interface RmpBrandsColumnsContext {
  /** Full set of brands for cell label lookups (so labels still resolve for inactive/legacy assignments). */
  authorizedBrandOptions: EnumOption[];
  /** Subset of brands shown in the editor dropdown (typically active only). Defaults to `authorizedBrandOptions`. */
  authorizedBrandEditorOptions?: EnumOption[];
}

export const buildRmpBrandsColumns = ({
  authorizedBrandOptions,
  authorizedBrandEditorOptions,
}: RmpBrandsColumnsContext): BulkEditColumn<RmpBrand>[] => [
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
    required: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'authorized_brand_id',
    name: 'Authorized Brand',
    type: 'enum',
    width: 220,
    nullable: true,
    emptyLabel: 'None',
    options: authorizedBrandOptions,
    editorOptions: authorizedBrandEditorOptions ?? authorizedBrandOptions,
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

export const rmpBrandsGetRowId = (row: RmpBrand): string => row.id;

export const rmpBrandsCreateEmptyRow = (): RmpBrand => ({
  id: '',
  name: '',
  position: 0,
  is_deleted: false,
  main_category: '',
  authorized_brand_id: undefined,
  authorized_brand: undefined,
  image: '',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

/** Helper to extract the selected File from an image column value. */
function getImageFileFromRow(row: RmpBrand): File | undefined {
  const imageValue = row.image as unknown as ImageValue | undefined;
  return imageValue?.file;
}

export const rmpBrandsToCreatePayload = (row: RmpBrand): RmpBrandCreatePayload => ({
  name: row.name,
  position: row.position,
  authorized_brand_id: row.authorized_brand_id || undefined,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpBrandsToUpdatePayload = (row: RmpBrand): RmpBrandUpdatePayload => ({
  name: row.name,
  position: row.position,
  authorized_brand_id: row.authorized_brand_id || undefined,
  status: row.status,
  is_deleted: row.status === 'inactive',
  imageFile: getImageFileFromRow(row),
});

export const rmpBrandsQueryKey = ['rmp_brands'];

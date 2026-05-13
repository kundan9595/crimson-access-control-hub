import type { BulkEditColumn, BulkEditConfig } from '../types';
import type { RmpPriceType } from '@/services/masters/rmpPriceTypesService';

export interface RmpPriceTypeCreatePayload {
  name: string;
  price_for: 'customer' | 'dealer' | 'zone';
  zone_id: string;
  status: string;
  is_deleted: boolean;
}

export interface RmpPriceTypeUpdatePayload {
  name?: string;
  price_for?: 'customer' | 'dealer' | 'zone';
  zone_id?: string;
  status?: string;
  is_deleted?: boolean;
}

export const rmpPriceTypesColumns: BulkEditColumn<RmpPriceType>[] = [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'price_for',
    name: 'Price For',
    type: 'enum',
    required: true,
    width: 120,
    options: [
      { value: 'customer', label: 'Customer' },
      { value: 'dealer', label: 'Dealer' },
      { value: 'zone', label: 'Zone' },
    ],
  },
  {
    key: 'zone_id',
    name: 'Zone ID',
    type: 'text',
    width: 150,
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

export const rmpPriceTypesGetRowId = (row: RmpPriceType): string => row.id;

export const rmpPriceTypesCreateEmptyRow = (): RmpPriceType => ({
  id: '',
  name: '',
  price_for: 'zone',
  zone_id: '',
  is_deleted: false,
  status: 'active',
  zone: undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const rmpPriceTypesToCreatePayload = (row: RmpPriceType): RmpPriceTypeCreatePayload => ({
  name: row.name,
  price_for: row.price_for,
  zone_id: row.zone_id || '',
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpPriceTypesToUpdatePayload = (row: RmpPriceType): RmpPriceTypeUpdatePayload => ({
  name: row.name,
  price_for: row.price_for,
  zone_id: row.zone_id || '',
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpPriceTypesQueryKey = ['rmp_price_types'];

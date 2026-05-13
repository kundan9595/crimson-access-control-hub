import type { BulkEditColumn, EnumOption } from '../types';
import type { RmpPrice } from '@/services/masters/rmpPricesService';

export interface RmpPriceCreatePayload {
  name: string;
  price: number;
  mrp: number;
  rmp_sku_id: string;
  rmp_price_type_id: string;
  status: string;
  is_deleted: boolean;
}

export interface RmpPriceUpdatePayload {
  name?: string;
  price?: number;
  mrp?: number;
  rmp_sku_id?: string;
  rmp_price_type_id?: string;
  status?: string;
  is_deleted?: boolean;
}

export interface RmpPricesColumnsContext {
  /** Full set of RMP SKUs for cell label lookups (so labels still resolve for inactive/legacy assignments). */
  rmpSkuOptions: EnumOption[];
  /** Subset of RMP SKUs shown in the editor dropdown (typically active only). Defaults to `rmpSkuOptions`. */
  rmpSkuEditorOptions?: EnumOption[];
  /** Full set of RMP price types for cell label lookups. */
  rmpPriceTypeOptions: EnumOption[];
  /** Subset of RMP price types shown in the editor dropdown (typically active only). */
  rmpPriceTypeEditorOptions?: EnumOption[];
}

export const buildRmpPricesColumns = ({
  rmpSkuOptions,
  rmpSkuEditorOptions,
  rmpPriceTypeOptions,
  rmpPriceTypeEditorOptions,
}: RmpPricesColumnsContext): BulkEditColumn<RmpPrice>[] => [
  {
    key: 'name',
    name: 'Name',
    type: 'text',
    required: true,
    width: 200,
  },
  {
    key: 'price',
    name: 'Price',
    type: 'decimal',
    min: 0,
    width: 120,
    required: true,
  },
  {
    key: 'mrp',
    name: 'MRP',
    type: 'decimal',
    min: 0,
    width: 120,
    required: true,
  },
  {
    key: 'rmp_sku_id',
    name: 'RMP SKU',
    type: 'enum',
    width: 240,
    required: true,
    nullable: false,
    emptyLabel: 'None',
    options: rmpSkuOptions,
    editorOptions: rmpSkuEditorOptions ?? rmpSkuOptions,
  },
  {
    key: 'rmp_price_type_id',
    name: 'Price Type',
    type: 'enum',
    width: 220,
    required: true,
    nullable: false,
    emptyLabel: 'None',
    options: rmpPriceTypeOptions,
    editorOptions: rmpPriceTypeEditorOptions ?? rmpPriceTypeOptions,
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

export const rmpPricesGetRowId = (row: RmpPrice): string => row.id;

export const rmpPricesCreateEmptyRow = (): RmpPrice => ({
  id: '',
  name: '',
  price: 0,
  mrp: 0,
  is_deleted: false,
  rmp_sku_id: '',
  rmp_price_type_id: '',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const rmpPricesToCreatePayload = (row: RmpPrice): RmpPriceCreatePayload => ({
  name: row.name,
  price: Number(row.price) || 0,
  mrp: Number(row.mrp) || 0,
  rmp_sku_id: row.rmp_sku_id,
  rmp_price_type_id: row.rmp_price_type_id,
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpPricesToUpdatePayload = (row: RmpPrice): RmpPriceUpdatePayload => ({
  name: row.name,
  price: Number(row.price) || 0,
  mrp: Number(row.mrp) || 0,
  rmp_sku_id: row.rmp_sku_id,
  rmp_price_type_id: row.rmp_price_type_id,
  status: row.status,
  is_deleted: row.status === 'inactive',
});

export const rmpPricesQueryKey = ['rmp_prices'];

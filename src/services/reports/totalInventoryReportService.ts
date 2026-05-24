import {
  callScottDashboard,
  extractRecords,
  type ScottQueryValue,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';
import {
  INVENTORY_REPORT_API_ENABLED,
  INVENTORY_REPORT_WH1_NAME,
  INVENTORY_REPORT_WH2_NAME,
} from '@/config/inventoryReportConfig';
import {
  enrichInventoryRows,
  type InventoryReportComputedRow,
  type InventoryReportRawRow,
} from '@/utils/inventoryReportMetrics';
import { formatDateForScott } from '@/services/reports/rmpSalesReportService';

export interface TotalInventoryFilter {
  start_date?: string;
  end_date?: string;
}

export interface TotalInventoryRawRow extends InventoryReportRawRow {
  id?: string;
  sku_code?: string;
  rmp_sku_name?: string;
  warehouses?: { warehouse_name?: string; name?: string; qty?: number; quantity?: number }[];
  [key: string]: unknown;
}

export type TotalInventoryRow = InventoryReportComputedRow & {
  id: string;
};

export const TOTAL_INVENTORY_TABLE_COLUMNS = [
  'sku',
  'inventory',
  'drr',
  'drrValue',
  'daysOfCover',
  'status',
  'salesLossDueToOos',
] as const;

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function pickNumeric(r: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = num(r[key]);
    if (value != null) return value;
  }
  return undefined;
}

function pickString(r: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = str(r[key]);
    if (value) return value;
  }
  return undefined;
}

function qtyFromWarehouseList(
  warehouses: unknown,
  targetName: string,
): number | undefined {
  if (!Array.isArray(warehouses) || !targetName || targetName === 'WH1_NAME_TBD') {
    return undefined;
  }
  const normalizedTarget = targetName.toLowerCase();
  for (const item of warehouses) {
    if (!item || typeof item !== 'object') continue;
    const w = item as Record<string, unknown>;
    const name = pickString(w, ['warehouse_name', 'name', 'warehouse', 'title']);
    if (name?.toLowerCase() === normalizedTarget) {
      return pickNumeric(w, ['qty', 'quantity', 'available_qty', 'available_quantity', 'stock']);
    }
  }
  return undefined;
}

export function normalizeTotalInventoryRow(r: Record<string, unknown>): TotalInventoryRawRow {
  const wh1Direct = pickNumeric(r, ['wh1_qty', 'wh1Qty', 'warehouse_1_qty']);
  const wh2Direct = pickNumeric(r, ['wh2_qty', 'wh2Qty', 'warehouse_2_qty']);
  const wh1FromList = qtyFromWarehouseList(r.warehouses ?? r.Warehouses, INVENTORY_REPORT_WH1_NAME);
  const wh2FromList = qtyFromWarehouseList(r.warehouses ?? r.Warehouses, INVENTORY_REPORT_WH2_NAME);
  const wh1_qty = wh1Direct ?? wh1FromList;
  const wh2_qty = wh2Direct ?? wh2FromList;

  return {
    ...r,
    id: pickString(r, ['id', 'sku_id', 'rmp_sku_id']) ?? pickString(r, ['sku', 'sku_code']),
    sku:
      pickString(r, ['sku', 'sku_code', 'rmp_sku_name', 'name', 'product_name']) ??
      pickString(r, ['id']),
    wh1_qty,
    wh2_qty,
    inventory: pickNumeric(r, ['inventory', 'total_inventory', 'total_qty', 'qty', 'quantity']),
    price: pickNumeric(r, ['price', 'unit_price', 'mrp', 'selling_price', 'rate']),
    three_month_sales: pickNumeric(r, [
      'three_month_sales',
      'sales_qty_90d',
      'sales_90d',
      'three_month_qty',
      'avg_sales_90d',
    ]),
    sales_qty_90d: pickNumeric(r, ['sales_qty_90d', 'three_month_sales', 'sales_90d']),
  };
}

export const MOCK_INVENTORY_RAW_ROWS: TotalInventoryRawRow[] = [
  {
    id: 'mock-1',
    sku: 'SCOTT-FS-DGR-M',
    wh1_qty: 120,
    wh2_qty: 80,
    price: 1410.15,
    three_month_sales: 450,
  },
  {
    id: 'mock-2',
    sku: 'SCOTT-SS-BLU-L',
    wh1_qty: 15,
    wh2_qty: 10,
    price: 890,
    three_month_sales: 900,
  },
  {
    id: 'mock-3',
    sku: 'SCOTT-Polo-WHT-S',
    wh1_qty: 5,
    wh2_qty: 3,
    price: 650,
    three_month_sales: 270,
  },
];

function buildInventoryQuery(
  params: ScottPageParams | undefined,
  filters?: TotalInventoryFilter,
): Record<string, ScottQueryValue> {
  const query: Record<string, ScottQueryValue> = {};
  if (params) {
    query.items = params.items;
    query.page = params.page;
  }
  if (filters?.start_date) query.start_date = filters.start_date;
  if (filters?.end_date) query.end_date = filters.end_date;
  return query;
}

function toComputedRows(
  rawRows: TotalInventoryRawRow[],
  daysInPeriod: number,
): TotalInventoryRow[] {
  return enrichInventoryRows(rawRows, daysInPeriod).map((computed, index) => ({
    ...computed,
    id: String(rawRows[index]?.id ?? rawRows[index]?.sku ?? index),
  }));
}

export function auditInventoryReportFields(rows: TotalInventoryRow[]): Record<string, string> {
  const total = rows.length || 1;
  const fields: (keyof TotalInventoryRow)[] = [
    'sku',
    'inventory',
    'drr',
    'drrValue',
    'daysOfCover',
    'status',
    'salesLossDueToOos',
  ];

  const report: Record<string, string> = {};
  for (const field of fields) {
    const filled = rows.filter((row) => {
      const v = row[field];
      if (v == null || v === '') return false;
      if (typeof v === 'number' && v === 0 && field !== 'inventory') return false;
      if (field === 'sku' && v === '-') return false;
      return true;
    }).length;
    report[field] = `${((filled / total) * 100).toFixed(1)}% (${filled}/${rows.length})`;
  }

  if (import.meta.env.DEV) {
    console.table(report);
  }
  return report;
}

async function fetchFromScottApi(
  params: ScottPageParams,
  filters?: TotalInventoryFilter,
): Promise<ScottPaginatedResult<TotalInventoryRawRow>> {
  const query = buildInventoryQuery(params, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'inventory_reports',
    method: 'GET',
    query,
  });
  const records = extractRecords(body);
  const data = records.map((r) => normalizeTotalInventoryRow(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, params, data.length),
  };
}

export async function fetchTotalInventoryPaginated(
  params?: Partial<ScottPageParams>,
  filters?: TotalInventoryFilter,
  daysInPeriod = 30,
): Promise<ScottPaginatedResult<TotalInventoryRow>> {
  const p = normalizeScottPageParams(params);

  if (!INVENTORY_REPORT_API_ENABLED) {
    if (import.meta.env.DEV) {
      const all = toComputedRows(MOCK_INVENTORY_RAW_ROWS, daysInPeriod);
      const start = (p.page - 1) * p.items;
      const pageData = all.slice(start, start + p.items);
      return {
        data: pageData,
        page: p.page,
        pageSize: p.items,
        totalCount: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / p.items)),
        totalCountIsExact: true,
      };
    }
    return {
      data: [],
      page: p.page,
      pageSize: p.items,
      totalCount: 0,
      totalPages: 1,
      totalCountIsExact: true,
    };
  }

  const result = await fetchFromScottApi(p, filters);
  return {
    ...result,
    data: toComputedRows(result.data, daysInPeriod),
  };
}

export async function fetchAllTotalInventory(
  filters?: TotalInventoryFilter,
  daysInPeriod = 30,
): Promise<TotalInventoryRow[]> {
  if (!INVENTORY_REPORT_API_ENABLED) {
    if (import.meta.env.DEV) {
      return toComputedRows(MOCK_INVENTORY_RAW_ROWS, daysInPeriod);
    }
    return [];
  }

  const first = await fetchFromScottApi(normalizeScottPageParams({ page: 1, items: 100 }), filters);
  const allRaw = [...first.data];
  let page = 2;
  while (page <= first.totalPages && page <= 100) {
    const next = await fetchFromScottApi(
      normalizeScottPageParams({ page, items: 100 }),
      filters,
    );
    allRaw.push(...next.data);
    page += 1;
  }
  return toComputedRows(allRaw, daysInPeriod);
}

export function buildTotalInventoryApiFilters(
  startDate: string,
  endDate: string,
): TotalInventoryFilter {
  return {
    start_date: formatDateForScott(startDate),
    end_date: formatDateForScott(endDate),
  };
}

export { formatDateForScott };

export function isInventoryReportApiPending(): boolean {
  return !INVENTORY_REPORT_API_ENABLED;
}

export function isWhConfigPending(): boolean {
  return (
    INVENTORY_REPORT_WH1_NAME === 'WH1_NAME_TBD' ||
    INVENTORY_REPORT_WH2_NAME === 'WH2_NAME_TBD'
  );
}

import {
  callScottDashboard,
  extractRecords,
  normalizeId,
  type ScottQueryValue,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export type RmpReportType = 'pending' | 'completed' | 'overdue' | 'failed';
export type RmpReportTypeFilter = RmpReportType | 'all';

export interface RmpSalesFilter {
  report_type?: RmpReportType;
  start_date?: string;
  end_date?: string;
  customer_ids?: string[];
}

export interface RmpBrandOrdersFilter extends RmpSalesFilter {
  brand_id?: string;
}

export interface RmpClassOrdersFilter extends RmpSalesFilter {
  class_id?: string;
}

export interface RmpScOrdersFilter extends RmpSalesFilter {
  user_id?: string;
}

export interface RmpOrderRow {
  id: string;
  order_id?: string;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_code?: string;
  customer_type?: string;
  order_date?: string;
  total_amount?: number;
  total_qty?: number;
  ordered_qty?: number;
  delivered_qty?: number;
  status?: string;
  report_type?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface RmpBreakdownMetrics {
  item_qty?: number;
  order_value?: number;
  closed_ordered_qty?: number;
  closed_ordered_value?: number;
  distributor_qty?: number;
  distributor_value?: number;
  distributor_closed_qty?: number;
  distributor_closed_value?: number;
  other_customer_qty?: number;
  other_customer_value?: number;
  other_customer_closed_qty?: number;
  other_customer_closed_value?: number;
}

export interface RmpBrandOrderRow extends RmpBreakdownMetrics {
  id: string;
  brand_id?: string;
  rmp_brand_id?: string;
  brand_name?: string;
  /** @deprecated use item_qty */
  total_qty?: number;
  /** @deprecated use order_value */
  total_amount?: number;
  order_count?: number;
  [key: string]: unknown;
}

export interface RmpClassOrderRow extends RmpBreakdownMetrics {
  id: string;
  class_id?: string;
  rmp_class_id?: string;
  class_name?: string;
  /** @deprecated use item_qty */
  total_qty?: number;
  /** @deprecated use order_value */
  total_amount?: number;
  order_count?: number;
  drr?: number;
  [key: string]: unknown;
}

export interface RmpScOrderRow {
  id: string;
  user_id?: string;
  user_name?: string;
  coordinator_name?: string;
  ordered_qty?: number;
  order_value?: number;
  closed_ordered_qty?: number;
  closed_ordered_value?: number;
  /** @deprecated use ordered_qty */
  total_qty?: number;
  /** @deprecated use order_value */
  total_amount?: number;
  order_count?: number;
  [key: string]: unknown;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[₹,\s]/g, '');
    if (cleaned === '') return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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

const AMOUNT_KEYS = [
  'total_amount',
  'sales_value',
  'amount',
  'revenue',
  'total_sales',
  'grand_total',
  'total',
  'order_total',
  'bill_amount',
  'net_amount',
  'sales_amount',
  'price',
  'value',
  'total_price',
  'order_amount',
  'net_value',
  'total_value',
];

const ORDER_COUNT_KEYS = [
  'order_count',
  'orders_count',
  'count',
  'no_of_orders',
  'no_of_order',
  'total_orders',
  'orders_total',
  'order_qty',
  'order_quantity',
  'total_order',
  'pending_order',
  'completed_order',
  'orderCount',
  'ordersCount',
  'totalOrders',
  'noOfOrders',
];

const UNIT_QTY_KEYS = [
  'total_qty',
  'total_quantity',
  'units_sold',
  'total_units',
  'unit_count',
];

const QTY_KEYS = [...UNIT_QTY_KEYS, 'quantity', 'qty'];

const ITEM_QTY_KEYS = [
  'item_qty',
  'ordered_qty',
  'order_qty',
  'total_qty',
  'total_quantity',
  'quantity',
  'qty',
];

const ORDER_VALUE_KEYS = [
  'order_value',
  'total_amount',
  'sales_value',
  'amount',
  'revenue',
  'value',
  'grand_total',
  'total',
  'total_sales',
];

const CLOSED_ORDERED_QTY_KEYS = [
  'closed_ordered_qty',
  'closed_qty',
  'completed_qty',
  'delivered_qty',
  'closed_order_qty',
  'closed_quantity',
];

const CLOSED_ORDERED_VALUE_KEYS = [
  'closed_ordered_value',
  'closed_value',
  'completed_value',
  'delivered_value',
  'closed_order_value',
  'closed_amount',
];

const DISTRIBUTOR_QTY_KEYS = [
  'distributor_qty',
  'distributor_ordered_qty',
  'distributor_order_qty',
  'distributor_quantity',
];

const DISTRIBUTOR_VALUE_KEYS = [
  'distributor_value',
  'distributor_order_value',
  'distributor_amount',
  'distributor_sales_value',
];

const DISTRIBUTOR_CLOSED_QTY_KEYS = [
  'distributor_closed_qty',
  'distributor_closed_ordered_qty',
  'distributor_completed_qty',
  'distributor_delivered_qty',
];

const DISTRIBUTOR_CLOSED_VALUE_KEYS = [
  'distributor_closed_value',
  'distributor_closed_ordered_value',
  'distributor_completed_value',
];

const OTHER_CUSTOMER_QTY_KEYS = [
  'other_customer_qty',
  'other_qty',
  'other_ordered_qty',
  'other_customer_ordered_qty',
  'retail_qty',
  'other_order_qty',
];

const OTHER_CUSTOMER_VALUE_KEYS = [
  'other_customer_value',
  'other_value',
  'other_order_value',
  'other_customer_order_value',
  'retail_value',
];

const OTHER_CUSTOMER_CLOSED_QTY_KEYS = [
  'other_customer_closed_qty',
  'other_closed_qty',
  'other_closed_ordered_qty',
  'other_customer_closed_ordered_qty',
  'retail_closed_qty',
];

const OTHER_CUSTOMER_CLOSED_VALUE_KEYS = [
  'other_customer_closed_value',
  'other_closed_value',
  'other_closed_ordered_value',
  'other_customer_closed_ordered_value',
  'retail_closed_value',
];

function normalizeBreakdownMetrics(r: Record<string, unknown>): RmpBreakdownMetrics {
  const item_qty = pickNumeric(r, ITEM_QTY_KEYS);
  const order_value = pickNumeric(r, ORDER_VALUE_KEYS);
  return {
    item_qty,
    order_value,
    closed_ordered_qty: pickNumeric(r, CLOSED_ORDERED_QTY_KEYS),
    closed_ordered_value: pickNumeric(r, CLOSED_ORDERED_VALUE_KEYS),
    distributor_qty: pickNumeric(r, DISTRIBUTOR_QTY_KEYS),
    distributor_value: pickNumeric(r, DISTRIBUTOR_VALUE_KEYS),
    distributor_closed_qty: pickNumeric(r, DISTRIBUTOR_CLOSED_QTY_KEYS),
    distributor_closed_value: pickNumeric(r, DISTRIBUTOR_CLOSED_VALUE_KEYS),
    other_customer_qty: pickNumeric(r, OTHER_CUSTOMER_QTY_KEYS),
    other_customer_value: pickNumeric(r, OTHER_CUSTOMER_VALUE_KEYS),
    other_customer_closed_qty: pickNumeric(r, OTHER_CUSTOMER_CLOSED_QTY_KEYS),
    other_customer_closed_value: pickNumeric(r, OTHER_CUSTOMER_CLOSED_VALUE_KEYS),
  };
}

function normalizeCoordinatorMetrics(r: Record<string, unknown>): {
  ordered_qty?: number;
  order_value?: number;
  closed_ordered_qty?: number;
  closed_ordered_value?: number;
} {
  const ordered_qty = pickNumeric(r, ITEM_QTY_KEYS);
  const order_value = pickNumeric(r, ORDER_VALUE_KEYS);
  return {
    ordered_qty,
    order_value,
    closed_ordered_qty: pickNumeric(r, CLOSED_ORDERED_QTY_KEYS),
    closed_ordered_value: pickNumeric(r, CLOSED_ORDERED_VALUE_KEYS),
  };
}

function pickOrderCount(r: Record<string, unknown>): number | undefined {
  const direct = pickNumeric(r, ORDER_COUNT_KEYS);
  if (direct != null) return direct;

  const orders = r.orders;
  if (Array.isArray(orders)) return orders.length;
  if (typeof orders === 'number' && Number.isFinite(orders)) return orders;

  for (const [key, value] of Object.entries(r)) {
    if (
      /order.*count|count.*order|^orders?$/i.test(key) &&
      !['order_date', 'order_id', 'order_number', 'order_no', 'order_amount', 'order_total'].includes(key)
    ) {
      const n = num(value);
      if (n != null) return n;
    }
  }

  return undefined;
}

/** Scott aggregate endpoints often use `quantity`/`qty` for order count, not unit count. */
function pickAggregateMetrics(r: Record<string, unknown>): {
  total_qty?: number;
  order_count?: number;
} {
  const unitQty = pickNumeric(r, UNIT_QTY_KEYS);
  const orderQty = pickNumeric(r, ['quantity', 'qty']);
  const orderCount = pickOrderCount(r) ?? orderQty ?? unitQty;

  return {
    total_qty: unitQty ?? orderQty,
    order_count: orderCount,
  };
}

function extractNestedCustomer(r: Record<string, unknown>): {
  id?: string;
  name?: string;
  code?: string;
  type?: string;
} {
  const raw = r.customer ?? r.Customer;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const c = raw as Record<string, unknown>;
  return {
    id: pickString(c, ['id', 'customer_id', 'customerId']),
    name: pickString(c, ['company_name', 'customer_name', 'name']),
    code: pickString(c, ['customer_code', 'code']),
    type: pickString(c, ['customer_type', 'type']),
  };
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function extractEmbeddedEntity(
  r: Record<string, unknown>,
  snakeKey: string,
  pascalKey: string,
): { id: string; name: string } | undefined {
  const raw = r[snakeKey] ?? r[pascalKey];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const idVal = o.id ?? o[`${snakeKey}_id`];
  if (idVal == null || idVal === '') return undefined;
  return {
    id: normalizeId(idVal),
    name: String(o.name ?? o.title ?? ''),
  };
}

function resolveEntityId(
  r: Record<string, unknown>,
  idKeys: string[],
  embedded?: { id: string },
): string | undefined {
  for (const key of idKeys) {
    const v = str(r[key]);
    if (v) return v;
  }
  return embedded?.id;
}

function resolveEntityName(
  r: Record<string, unknown>,
  nameKeys: string[],
  embedded?: { name: string },
): string | undefined {
  for (const key of nameKeys) {
    const v = str(r[key]);
    if (v) return v;
  }
  const embeddedName = embedded?.name?.trim();
  return embeddedName || undefined;
}

function normalizeOrderRow(r: Record<string, unknown>): RmpOrderRow {
  const nestedCustomer = extractNestedCustomer(r);

  return {
    ...r,
    id: normalizeId(
      pickString(r, ['id', 'order_id', 'orderId']) ?? r.id ?? r.order_id,
    ),
    order_id: pickString(r, ['order_id', 'orderId', 'id']),
    order_number: pickString(r, [
      'order_number',
      'order_no',
      'number',
      'invoice_no',
      'ref_no',
      'reference_number',
      'po_number',
      'order_code',
    ]),
    customer_id:
      pickString(r, ['customer_id', 'customerId']) ?? nestedCustomer.id,
    customer_name:
      pickString(r, ['customer_name', 'customer', 'company_name', 'name']) ??
      nestedCustomer.name,
    customer_code:
      pickString(r, ['customer_code', 'code']) ?? nestedCustomer.code,
    customer_type:
      pickString(r, ['customer_type', 'type']) ?? nestedCustomer.type,
    order_date: pickString(r, [
      'order_date',
      'date',
      'created_at',
      'order_created_at',
      'placed_at',
    ]),
    total_amount: pickNumeric(r, AMOUNT_KEYS),
    total_qty: pickNumeric(r, QTY_KEYS),
    ordered_qty: pickNumeric(r, ['ordered_qty', 'ordered_quantity', 'order_qty']),
    delivered_qty: pickNumeric(r, ['delivered_qty', 'delivered_quantity', 'delivered']),
    status: pickString(r, ['status', 'report_type', 'order_status']),
    report_type: pickString(r, ['report_type']),
    created_at: pickString(r, ['created_at']),
    updated_at: pickString(r, ['updated_at']),
  };
}

function normalizeBrandOrderRow(r: Record<string, unknown>): RmpBrandOrderRow {
  const embeddedBrand = extractEmbeddedEntity(r, 'rmp_brand', 'RmpBrand');
  const brandId = resolveEntityId(
    r,
    ['brand_id', 'rmp_brand_id', 'rmpBrandId', 'BrandId'],
    embeddedBrand,
  );
  const brandName = resolveEntityName(
    r,
    ['brand_name', 'rmp_brand_name', 'brand', 'title', 'name'],
    embeddedBrand,
  );
  const metrics = pickAggregateMetrics(r);
  const breakdown = normalizeBreakdownMetrics(r);

  return {
    ...r,
    ...breakdown,
    id: normalizeId(r.id ?? brandId ?? r.brand_id ?? r.rmp_brand_id),
    brand_id: brandId,
    rmp_brand_id: brandId,
    brand_name: brandName,
    total_qty: breakdown.item_qty ?? metrics.total_qty,
    total_amount: breakdown.order_value ?? pickNumeric(r, AMOUNT_KEYS),
    order_count: metrics.order_count,
  };
}

function normalizeClassOrderRow(r: Record<string, unknown>): RmpClassOrderRow {
  const embeddedClass = extractEmbeddedEntity(r, 'rmp_class', 'RmpClass');
  const classId = resolveEntityId(
    r,
    ['class_id', 'rmp_class_id', 'rmpClassId', 'ClassId'],
    embeddedClass,
  );
  const className = resolveEntityName(
    r,
    ['class_name', 'rmp_class_name', 'class', 'title', 'name'],
    embeddedClass,
  );
  const metrics = pickAggregateMetrics(r);
  const breakdown = normalizeBreakdownMetrics(r);

  return {
    ...r,
    ...breakdown,
    id: normalizeId(r.id ?? classId ?? r.class_id ?? r.rmp_class_id),
    class_id: classId,
    rmp_class_id: classId,
    class_name: className,
    total_qty: breakdown.item_qty ?? metrics.total_qty,
    total_amount: breakdown.order_value ?? pickNumeric(r, AMOUNT_KEYS),
    order_count: metrics.order_count,
    drr: pickNumeric(r, ['drr', 'daily_run_rate', 'run_rate', 'daily_rate']),
  };
}

function normalizeScOrderRow(r: Record<string, unknown>): RmpScOrderRow {
  const embeddedUser = extractEmbeddedEntity(r, 'user', 'User')
    ?? extractEmbeddedEntity(r, 'sales_coordinator', 'SalesCoordinator')
    ?? extractEmbeddedEntity(r, 'sc_user', 'ScUser');
  const userId = resolveEntityId(
    r,
    ['user_id', 'sc_user_id', 'coordinator_id', 'employee_id'],
    embeddedUser,
  );
  const userName = resolveEntityName(
    r,
    [
      'coordinator_name',
      'user_name',
      'sc_name',
      'employee_name',
      'sales_coordinator_name',
      'name',
    ],
    embeddedUser,
  );
  const metrics = pickAggregateMetrics(r);
  const coordinator = normalizeCoordinatorMetrics(r);

  return {
    ...r,
    ...coordinator,
    id: normalizeId(r.id ?? userId ?? r.user_id),
    user_id: userId,
    user_name: userName,
    coordinator_name: userName,
    total_qty: coordinator.ordered_qty ?? metrics.total_qty,
    total_amount: coordinator.order_value ?? pickNumeric(r, AMOUNT_KEYS),
    order_count: metrics.order_count,
  };
}

export function extractOrderTrackingRecords(body: unknown): Record<string, unknown>[] {
  const rows = extractRecords(body);
  if (rows.length > 0) return rows;

  const walk = (node: unknown, depth = 0): Record<string, unknown>[] => {
    if (depth > 6 || node == null || typeof node !== 'object') return [];
    if (Array.isArray(node)) {
      return node.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
    }

    const o = node as Record<string, unknown>;
    for (const key of [
      'class_orders',
      'brand_orders',
      'sc_orders',
      'orders',
      'data',
      'records',
      'items',
      'results',
    ]) {
      if (key in o) {
        const found = walk(o[key], depth + 1);
        if (found.length > 0) return found;
      }
    }

    const entries = Object.entries(o);
    const looksLikeIdMap =
      entries.length > 0 &&
      entries.every(
        ([, v]) => v != null && typeof v === 'object' && !Array.isArray(v),
      ) &&
      entries.some(([k]) => /^\d+$/.test(k));

    if (looksLikeIdMap) {
      return entries.map(([key, value]) => {
        const row = value as Record<string, unknown>;
        return {
          ...row,
          class_id: row.class_id ?? row.rmp_class_id ?? key,
          rmp_class_id: row.rmp_class_id ?? row.class_id ?? key,
          brand_id: row.brand_id ?? row.rmp_brand_id ?? key,
          rmp_brand_id: row.rmp_brand_id ?? row.brand_id ?? key,
          user_id: row.user_id ?? row.coordinator_id ?? key,
        };
      });
    }

    return [];
  };

  return walk(body);
}

export function extractOrdersPageMeta(
  body: unknown,
  requested: ScottPageParams,
  rowCount: number,
): Omit<ScottPaginatedResult<never>, 'data'> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const root = body as Record<string, unknown>;
    const ordersWrapper = root.orders;
    if (ordersWrapper && typeof ordersWrapper === 'object' && !Array.isArray(ordersWrapper)) {
      const wrapped = ordersWrapper as Record<string, unknown>;
      if (Array.isArray(wrapped.data)) {
        return buildScottPaginatedMeta(wrapped, requested, rowCount);
      }
    }
    const data = root.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;
      const nestedOrders = dataObj.orders;
      if (nestedOrders && typeof nestedOrders === 'object' && !Array.isArray(nestedOrders)) {
        const ordersObj = nestedOrders as Record<string, unknown>;
        if (Array.isArray(ordersObj.data)) {
          return buildScottPaginatedMeta(ordersObj, requested, rowCount);
        }
      }
    }
  }

  return buildScottPaginatedMeta(body, requested, rowCount);
}

function buildSalesQuery(
  params: ScottPageParams | undefined,
  filters?: RmpSalesFilter,
): Record<string, ScottQueryValue> {
  const query: Record<string, ScottQueryValue> = {};
  if (params) {
    query.items = params.items;
    query.page = params.page;
  }
  if (filters?.report_type) query.report_type = filters.report_type;
  if (filters?.start_date) query.start_date = filters.start_date;
  if (filters?.end_date) query.end_date = filters.end_date;
  // Scott orders API does not document customer filters; kept for forward compatibility.
  if (filters?.customer_ids?.length === 1) {
    query.customer_id = filters.customer_ids[0];
  }
  if (filters?.customer_ids?.length) {
    query['customer_ids[]'] = filters.customer_ids;
  }
  return query;
}

export function resolveOrderCustomerId(row: RmpOrderRow): string | undefined {
  return row.customer_id != null && row.customer_id !== ''
    ? String(row.customer_id)
    : undefined;
}

export function orderMatchesCustomerFilter(
  row: RmpOrderRow,
  customerIds: string[],
): boolean {
  if (!customerIds.length) return true;
  const id = resolveOrderCustomerId(row);
  return id != null && customerIds.includes(id);
}

/** Convert YYYY-MM-DD (HTML date input) to DD-MM-YYYY (Scott API) */
export function formatDateForScott(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

/** Days between Scott DD-MM-YYYY dates (inclusive, minimum 1) */
export function daysBetweenScottDates(start?: string, end?: string): number {
  if (!start || !end) return 1;
  const parse = (s: string) => {
    const [d, m, y] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const a = parse(start);
  const b = parse(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

export async function fetchRmpOrdersPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpSalesFilter,
): Promise<ScottPaginatedResult<RmpOrderRow>> {
  const p = normalizeScottPageParams(params);
  const query = buildSalesQuery(p, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'orders',
    method: 'GET',
    query,
  });
  const records = extractOrderTrackingRecords(body);
  const data = records.map((r) => normalizeOrderRow(r));
  return {
    data,
    ...extractOrdersPageMeta(body, p, data.length),
  };
}

export const fetchRmpOrders = async (
  filters?: RmpSalesFilter,
): Promise<RmpOrderRow[]> =>
  fetchAllScottPages((pp) => fetchRmpOrdersPaginated(pp, filters), {
    pageSize: 100,
    maxPages: 100,
  });

export async function fetchRmpBrandOrders(
  filters?: RmpBrandOrdersFilter,
): Promise<RmpBrandOrderRow[]> {
  const query = buildSalesQuery(undefined, filters);
  if (filters?.brand_id) query.brand_id = filters.brand_id;
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'orders',
    method: 'GET',
    pathSuffix: 'brand_orders',
    query,
  });
  return extractOrderTrackingRecords(body).map((r) => normalizeBrandOrderRow(r));
}

export async function fetchRmpClassOrders(
  filters?: RmpClassOrdersFilter,
): Promise<RmpClassOrderRow[]> {
  const query = buildSalesQuery(undefined, filters);
  if (filters?.class_id) query.class_id = filters.class_id;
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'orders',
    method: 'GET',
    pathSuffix: 'class_orders',
    query,
  });
  return extractOrderTrackingRecords(body).map((r) => normalizeClassOrderRow(r));
}

export async function fetchRmpScOrders(
  filters?: RmpScOrdersFilter,
): Promise<RmpScOrderRow[]> {
  const query = buildSalesQuery(undefined, filters);
  if (filters?.user_id) query.user_id = filters.user_id;
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'orders',
    method: 'GET',
    pathSuffix: 'sc_orders',
    query,
  });
  return extractOrderTrackingRecords(body).map((r) => normalizeScOrderRow(r));
}

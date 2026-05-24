export type InventoryReportStatus = 'In Stock' | 'Out of Stock';

export type InventoryReportRawRow = {
  sku?: string;
  wh1_qty?: number;
  wh2_qty?: number;
  inventory?: number;
  price?: number;
  three_month_sales?: number;
  sales_qty_90d?: number;
};

export type InventoryReportComputedRow = {
  sku: string;
  inventory: number;
  drr: number;
  drrValue: number;
  daysOfCover: number | null;
  status: InventoryReportStatus;
  salesLossDueToOos: number;
  wh1_qty?: number;
  wh2_qty?: number;
  price?: number;
};

const OOS_DAYS_OF_COVER_THRESHOLD = 3;

export function computeDrr(threeMonthSales: number | undefined): number {
  if (threeMonthSales == null || threeMonthSales <= 0) return 0;
  return Math.round((threeMonthSales / 90) * 10) / 10;
}

export function computeInventoryReportMetrics(
  raw: InventoryReportRawRow,
  daysInPeriod: number,
): InventoryReportComputedRow {
  const inventory =
    raw.inventory ??
    ((raw.wh1_qty ?? 0) + (raw.wh2_qty ?? 0));
  const threeMonthSales = raw.three_month_sales ?? raw.sales_qty_90d;
  const drr = computeDrr(threeMonthSales);
  const price = raw.price ?? 0;
  const drrValue = drr > 0 && price > 0 ? drr * price : 0;
  const daysOfCover = drr > 0 ? inventory / drr : null;
  const status: InventoryReportStatus =
    daysOfCover != null && daysOfCover < OOS_DAYS_OF_COVER_THRESHOLD
      ? 'Out of Stock'
      : 'In Stock';
  const salesLossDueToOos =
    status === 'Out of Stock' && drrValue > 0 ? drrValue * daysInPeriod : 0;

  return {
    sku: raw.sku ?? '-',
    inventory,
    drr,
    drrValue,
    daysOfCover,
    status,
    salesLossDueToOos,
    wh1_qty: raw.wh1_qty,
    wh2_qty: raw.wh2_qty,
    price: raw.price,
  };
}

export function enrichInventoryRows(
  rows: InventoryReportRawRow[],
  daysInPeriod: number,
): InventoryReportComputedRow[] {
  return rows.map((row) => computeInventoryReportMetrics(row, daysInPeriod));
}

export function formatDaysOfCover(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '-';
  return value.toFixed(1);
}

export function formatDrr(value: number): string {
  if (value <= 0) return '-';
  return value.toFixed(1);
}

export function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value) || value === 0) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

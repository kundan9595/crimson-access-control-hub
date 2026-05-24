export type RmpPeriodMode = 'date' | 'month' | 'year';

export type RmpSalesPeriodConfig = {
  mode: RmpPeriodMode;
  /** YYYY-MM-DD — used when mode is `date` */
  startDate: string;
  endDate: string;
  /** 1–12 */
  month: number;
  year: number;
};

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createDefaultPeriodConfig(): RmpSalesPeriodConfig {
  const now = new Date();
  const start = new Date(now);
  start.setFullYear(now.getFullYear() - 1);
  return {
    mode: 'date',
    startDate: formatLocalDate(start),
    endDate: formatLocalDate(now),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

function monthRange(year: number, month: number): { startDate: string; endDate: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startDate: formatLocalDate(start), endDate: formatLocalDate(end) };
}

function yearRange(year: number): { startDate: string; endDate: string } {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

/** Resolve period config to ISO start/end dates (YYYY-MM-DD). */
export function resolvePeriodDateRange(config: RmpSalesPeriodConfig): {
  startDate: string;
  endDate: string;
} {
  switch (config.mode) {
    case 'month':
      return monthRange(config.year, config.month);
    case 'year':
      return yearRange(config.year);
    case 'date':
    default:
      return { startDate: config.startDate, endDate: config.endDate };
  }
}

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function yearOptions(count = 8): number[] {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - count + 1 + i);
}

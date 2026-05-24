export type CustomerPerformancePeriodMode = 'date' | 'week' | 'month' | 'year';

export type CustomerPerformancePeriodConfig = {
  mode: CustomerPerformancePeriodMode;
  startDate: string;
  endDate: string;
  weekValue: string;
  month: number;
  year: number;
};

export type CustomerPerformanceGrowthPeriod =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export const GROWTH_TYPE_OPTIONS: {
  value: CustomerPerformanceGrowthPeriod;
  label: string;
}[] = [
  { value: 'weekly', label: 'WoW Growth' },
  { value: 'monthly', label: 'MoM Growth' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function currentWeekValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + start.getDay()) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function createDefaultCustomerPerformancePeriod(): CustomerPerformancePeriodConfig {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    mode: 'month',
    startDate: formatLocalDate(prevMonth),
    endDate: formatLocalDate(now),
    weekValue: currentWeekValue(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function createDefaultPeriodB(): CustomerPerformancePeriodConfig {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 0);
  return {
    mode: 'month',
    startDate: formatLocalDate(twoMonthsAgo),
    endDate: formatLocalDate(oneMonthAgo),
    weekValue: currentWeekValue(),
    month: twoMonthsAgo.getMonth() + 1,
    year: twoMonthsAgo.getFullYear(),
  };
}

function weekRangeFromValue(weekValue: string): { startDate: string; endDate: string } {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue.trim());
  if (!match) {
    const now = new Date();
    return { startDate: formatLocalDate(now), endDate: formatLocalDate(now) };
  }
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { startDate: formatLocalDate(monday), endDate: formatLocalDate(sunday) };
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

export function resolveCustomerPerformancePeriodRange(
  config: CustomerPerformancePeriodConfig,
): { startDate: string; endDate: string } {
  switch (config.mode) {
    case 'week':
      return weekRangeFromValue(config.weekValue);
    case 'month':
      return monthRange(config.year, config.month);
    case 'year':
      return yearRange(config.year);
    case 'date':
    default:
      return { startDate: config.startDate, endDate: config.endDate };
  }
}

/** Union span of two period ranges for KPI date filter. */
export function unionPeriodRange(
  a: CustomerPerformancePeriodConfig,
  b: CustomerPerformancePeriodConfig,
): { startDate: string; endDate: string } {
  const rangeA = resolveCustomerPerformancePeriodRange(a);
  const rangeB = resolveCustomerPerformancePeriodRange(b);
  const starts = [rangeA.startDate, rangeB.startDate].sort();
  const ends = [rangeA.endDate, rangeB.endDate].sort();
  return { startDate: starts[0], endDate: ends[ends.length - 1] };
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

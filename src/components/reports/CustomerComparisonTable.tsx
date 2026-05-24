import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import type { CustomerComparisonRow } from '@/services/reports/customerPerformanceReportService';

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString();
}

function formatPct(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

interface CustomerComparisonTableProps {
  rows: CustomerComparisonRow[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load customer performance data';
}

export function CustomerComparisonTable({
  rows,
  isLoading,
  error,
  emptyMessage = 'No customer comparison data for the selected periods',
}: CustomerComparisonTableProps) {
  if (error) {
    return (
      <div className="text-center text-destructive py-8">{errorMessage(error)}</div>
    );
  }

  if (isLoading) {
    return <MasterTableSkeleton showToolbar={false} columnCount={13} />;
  }

  if (!rows.length) {
    return <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer ID</TableHead>
            <TableHead>Customer Type</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Qty (A)</TableHead>
            <TableHead>Value (A)</TableHead>
            <TableHead>Qty (B)</TableHead>
            <TableHead>Value (B)</TableHead>
            <TableHead>Qty Change</TableHead>
            <TableHead>Value Change</TableHead>
            <TableHead>Qty Change %</TableHead>
            <TableHead>Value Change %</TableHead>
            <TableHead>Last Order Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.customer_id || '-'}</TableCell>
              <TableCell className="capitalize">{row.customer_type || '-'}</TableCell>
              <TableCell>{row.customer_name || '-'}</TableCell>
              <TableCell>{row.zone || '-'}</TableCell>
              <TableCell>{formatNumber(row.qtyA)}</TableCell>
              <TableCell>{formatCurrency(row.valueA)}</TableCell>
              <TableCell>{formatNumber(row.qtyB)}</TableCell>
              <TableCell>{formatCurrency(row.valueB)}</TableCell>
              <TableCell>
                {row.qtyChange != null ? (
                  <Badge variant={row.qtyChange >= 0 ? 'secondary' : 'destructive'}>
                    {formatNumber(row.qtyChange)}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {row.valueChange != null ? (
                  <Badge variant={row.valueChange >= 0 ? 'secondary' : 'destructive'}>
                    {formatCurrency(row.valueChange)}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatPct(row.qtyChangePct)}</TableCell>
              <TableCell>{formatPct(row.valueChangePct)}</TableCell>
              <TableCell>{formatDate(row.last_order_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const CUSTOMER_COMPARISON_EXPORT_HEADERS = [
  'Customer ID',
  'Customer Type',
  'Customer Name',
  'Zone',
  'Qty (A)',
  'Value (A)',
  'Qty (B)',
  'Value (B)',
  'Qty Change',
  'Value Change',
  'Qty Change %',
  'Value Change %',
  'Last Order Date',
];

export function customerComparisonExportFieldMap() {
  return {
    'Customer ID': (item: CustomerComparisonRow) => item.customer_id || '-',
    'Customer Type': (item: CustomerComparisonRow) => item.customer_type || '-',
    'Customer Name': (item: CustomerComparisonRow) => item.customer_name || '-',
    Zone: (item: CustomerComparisonRow) => item.zone || '-',
    'Qty (A)': (item: CustomerComparisonRow) => formatNumber(item.qtyA),
    'Value (A)': (item: CustomerComparisonRow) => formatCurrency(item.valueA),
    'Qty (B)': (item: CustomerComparisonRow) => formatNumber(item.qtyB),
    'Value (B)': (item: CustomerComparisonRow) => formatCurrency(item.valueB),
    'Qty Change': (item: CustomerComparisonRow) => formatNumber(item.qtyChange),
    'Value Change': (item: CustomerComparisonRow) => formatCurrency(item.valueChange),
    'Qty Change %': (item: CustomerComparisonRow) => formatPct(item.qtyChangePct),
    'Value Change %': (item: CustomerComparisonRow) => formatPct(item.valueChangePct),
    'Last Order Date': (item: CustomerComparisonRow) => formatDate(item.last_order_date),
  };
}

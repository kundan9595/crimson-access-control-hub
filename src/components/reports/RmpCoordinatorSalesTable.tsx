import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RmpScOrderRow } from '@/services/reports/rmpSalesReportService';
import { fillRateTotal } from '@/utils/rmpSalesFillRates';

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString();
}

interface RmpCoordinatorSalesTableProps {
  rows: RmpScOrderRow[];
}

export function RmpCoordinatorSalesTable({ rows }: RmpCoordinatorSalesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sales Coordinator</TableHead>
            <TableHead>Ordered Qty</TableHead>
            <TableHead>Order Value</TableHead>
            <TableHead>Closed Ordered Qty</TableHead>
            <TableHead>Closed Ordered Value</TableHead>
            <TableHead className="text-amber-700 dark:text-amber-400">Fill Rate Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {row.coordinator_name ?? row.user_name ?? '-'}
              </TableCell>
              <TableCell>{formatQty(row.ordered_qty ?? row.total_qty)}</TableCell>
              <TableCell>{formatCurrency(row.order_value ?? row.total_amount)}</TableCell>
              <TableCell>{formatQty(row.closed_ordered_qty)}</TableCell>
              <TableCell>{formatCurrency(row.closed_ordered_value)}</TableCell>
              <TableCell className="text-amber-700 dark:text-amber-400">
                {fillRateTotal(
                  row.closed_ordered_qty,
                  row.ordered_qty ?? row.total_qty,
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const COORDINATOR_EXPORT_HEADERS = [
  'Sales Coordinator',
  'Ordered Qty',
  'Order Value',
  'Closed Ordered Qty',
  'Closed Ordered Value',
  'Fill Rate Total',
];

export function coordinatorExportFieldMap() {
  return {
    'Sales Coordinator': (item: RmpScOrderRow) =>
      item.coordinator_name ?? item.user_name ?? '-',
    'Ordered Qty': (item: RmpScOrderRow) =>
      String(item.ordered_qty ?? item.total_qty ?? 0),
    'Order Value': (item: RmpScOrderRow) =>
      formatCurrency(item.order_value ?? item.total_amount),
    'Closed Ordered Qty': (item: RmpScOrderRow) =>
      String(item.closed_ordered_qty ?? 0),
    'Closed Ordered Value': (item: RmpScOrderRow) =>
      formatCurrency(item.closed_ordered_value),
    'Fill Rate Total': (item: RmpScOrderRow) =>
      fillRateTotal(item.closed_ordered_qty, item.ordered_qty ?? item.total_qty),
  };
}

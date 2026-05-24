import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RmpBreakdownMetrics } from '@/services/reports/rmpSalesReportService';
import {
  distributorFillRate,
  fillRateTotal,
  otherFillRate,
} from '@/utils/rmpSalesFillRates';

export type BreakdownRow = RmpBreakdownMetrics & {
  id: string;
  label: string;
};

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return value.toLocaleString();
}

interface RmpBreakdownSalesTableProps {
  entityColumnLabel: 'Brand' | 'Class';
  rows: BreakdownRow[];
}

export function RmpBreakdownSalesTable({
  entityColumnLabel,
  rows,
}: RmpBreakdownSalesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px] sticky left-0 bg-background z-10">
              {entityColumnLabel}
            </TableHead>
            <TableHead>Item Qty</TableHead>
            <TableHead>Order Value</TableHead>
            <TableHead>Closed Ordered Qty</TableHead>
            <TableHead>Closed Ordered Value</TableHead>
            <TableHead>Distributor Qty</TableHead>
            <TableHead>Distributor Value</TableHead>
            <TableHead>Distributor Closed Qty</TableHead>
            <TableHead>Distributor Closed Value</TableHead>
            <TableHead>Other Customer Qty</TableHead>
            <TableHead>Other Customer Value</TableHead>
            <TableHead>Other Customer Closed Qty</TableHead>
            <TableHead>Other Customer Closed Value</TableHead>
            <TableHead className="text-amber-700 dark:text-amber-400">Fill Rate Total</TableHead>
            <TableHead className="text-amber-700 dark:text-amber-400">Distributor Fill Rate</TableHead>
            <TableHead className="text-amber-700 dark:text-amber-400">Other Fill Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium sticky left-0 bg-background">
                {row.label}
              </TableCell>
              <TableCell>{formatQty(row.item_qty)}</TableCell>
              <TableCell>{formatCurrency(row.order_value)}</TableCell>
              <TableCell>{formatQty(row.closed_ordered_qty)}</TableCell>
              <TableCell>{formatCurrency(row.closed_ordered_value)}</TableCell>
              <TableCell>{formatQty(row.distributor_qty)}</TableCell>
              <TableCell>{formatCurrency(row.distributor_value)}</TableCell>
              <TableCell>{formatQty(row.distributor_closed_qty)}</TableCell>
              <TableCell>{formatCurrency(row.distributor_closed_value)}</TableCell>
              <TableCell>{formatQty(row.other_customer_qty)}</TableCell>
              <TableCell>{formatCurrency(row.other_customer_value)}</TableCell>
              <TableCell>{formatQty(row.other_customer_closed_qty)}</TableCell>
              <TableCell>{formatCurrency(row.other_customer_closed_value)}</TableCell>
              <TableCell className="text-amber-700 dark:text-amber-400">
                {fillRateTotal(row.closed_ordered_qty, row.item_qty)}
              </TableCell>
              <TableCell className="text-amber-700 dark:text-amber-400">
                {distributorFillRate(row.distributor_closed_qty, row.distributor_qty)}
              </TableCell>
              <TableCell className="text-amber-700 dark:text-amber-400">
                {otherFillRate(row.other_customer_closed_qty, row.other_customer_qty)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** CSV export field map for breakdown tables */
export function breakdownExportFieldMap(entityLabel: string) {
  return {
    [entityLabel]: (item: BreakdownRow) => item.label,
    'Item Qty': (item: BreakdownRow) => String(item.item_qty ?? 0),
    'Order Value': (item: BreakdownRow) => formatCurrency(item.order_value),
    'Closed Ordered Qty': (item: BreakdownRow) => String(item.closed_ordered_qty ?? 0),
    'Closed Ordered Value': (item: BreakdownRow) =>
      formatCurrency(item.closed_ordered_value),
    'Distributor Qty': (item: BreakdownRow) => String(item.distributor_qty ?? 0),
    'Distributor Value': (item: BreakdownRow) => formatCurrency(item.distributor_value),
    'Distributor Closed Qty': (item: BreakdownRow) =>
      String(item.distributor_closed_qty ?? 0),
    'Distributor Closed Value': (item: BreakdownRow) =>
      formatCurrency(item.distributor_closed_value),
    'Other Customer Qty': (item: BreakdownRow) => String(item.other_customer_qty ?? 0),
    'Other Customer Value': (item: BreakdownRow) =>
      formatCurrency(item.other_customer_value),
    'Other Customer Closed Qty': (item: BreakdownRow) =>
      String(item.other_customer_closed_qty ?? 0),
    'Other Customer Closed Value': (item: BreakdownRow) =>
      formatCurrency(item.other_customer_closed_value),
    'Fill Rate Total': (item: BreakdownRow) =>
      fillRateTotal(item.closed_ordered_qty, item.item_qty),
    'Distributor Fill Rate': (item: BreakdownRow) =>
      distributorFillRate(item.distributor_closed_qty, item.distributor_qty),
    'Other Fill Rate': (item: BreakdownRow) =>
      otherFillRate(item.other_customer_closed_qty, item.other_customer_qty),
  };
}

export const BREAKDOWN_EXPORT_HEADERS = [
  'Brand',
  'Item Qty',
  'Order Value',
  'Closed Ordered Qty',
  'Closed Ordered Value',
  'Distributor Qty',
  'Distributor Value',
  'Distributor Closed Qty',
  'Distributor Closed Value',
  'Other Customer Qty',
  'Other Customer Value',
  'Other Customer Closed Qty',
  'Other Customer Closed Value',
  'Fill Rate Total',
  'Distributor Fill Rate',
  'Other Fill Rate',
];

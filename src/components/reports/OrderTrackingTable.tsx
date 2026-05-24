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
import {
  resolveOrderTrackingOrderId,
  type OrderTrackingRow,
} from '@/services/reports/orderTrackingReportService';

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

interface OrderTrackingTableProps {
  rows: OrderTrackingRow[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load order tracking data';
}

export function OrderTrackingTable({
  rows,
  isLoading,
  error,
  emptyMessage = 'No orders found for the selected filters',
}: OrderTrackingTableProps) {
  if (error) {
    return (
      <div className="text-center text-destructive py-8">{errorMessage(error)}</div>
    );
  }

  if (isLoading) {
    return <MasterTableSkeleton showToolbar={false} columnCount={10} />;
  }

  if (!rows.length) {
    return <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Date</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer Type</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uniware_reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDate(row.order_date)}</TableCell>
              <TableCell className="font-medium">{resolveOrderTrackingOrderId(row)}</TableCell>
              <TableCell className="capitalize">{row.customer_type || '-'}</TableCell>
              <TableCell>{row.customer_name || '-'}</TableCell>
              <TableCell>{row.class_name || '-'}</TableCell>
              <TableCell>{row.qty ?? '-'}</TableCell>
              <TableCell>{formatCurrency(row.price)}</TableCell>
              <TableCell>{formatCurrency(row.value)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{row.status || row.report_type || '-'}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.uniware_reason || undefined}>
                {row.uniware_reason || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function orderTrackingExportFieldMap() {
  return {
    'Order Date': (item: OrderTrackingRow) => formatDate(item.order_date),
    'Order ID': (item: OrderTrackingRow) => resolveOrderTrackingOrderId(item),
    'Customer Type': (item: OrderTrackingRow) => item.customer_type || '-',
    'Customer Name': (item: OrderTrackingRow) => item.customer_name || '-',
    Class: (item: OrderTrackingRow) => item.class_name || '-',
    Qty: (item: OrderTrackingRow) => (item.qty != null ? String(item.qty) : '-'),
    Price: (item: OrderTrackingRow) => formatCurrency(item.price),
    Value: (item: OrderTrackingRow) => formatCurrency(item.value),
    Status: (item: OrderTrackingRow) => item.status || item.report_type || '-',
    Uniware_reason: (item: OrderTrackingRow) => item.uniware_reason || '-',
  };
}

export const ORDER_TRACKING_EXPORT_HEADERS = [
  'Order Date',
  'Order ID',
  'Customer Type',
  'Customer Name',
  'Class',
  'Qty',
  'Price',
  'Value',
  'Status',
  'Uniware_reason',
];

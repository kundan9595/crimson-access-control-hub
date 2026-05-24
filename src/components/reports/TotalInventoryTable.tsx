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
import type { TotalInventoryRow } from '@/services/reports/totalInventoryReportService';
import {
  formatCurrency,
  formatDaysOfCover,
  formatDrr,
} from '@/utils/inventoryReportMetrics';

interface TotalInventoryTableProps {
  rows: TotalInventoryRow[];
  isLoading?: boolean;
  error?: unknown;
  emptyMessage?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load inventory report data';
}

export function TotalInventoryTable({
  rows,
  isLoading,
  error,
  emptyMessage = 'No inventory data found for the selected period',
}: TotalInventoryTableProps) {
  if (error) {
    return (
      <div className="text-center text-destructive py-8">{errorMessage(error)}</div>
    );
  }

  if (isLoading) {
    return <MasterTableSkeleton showToolbar={false} columnCount={7} />;
  }

  if (!rows.length) {
    return <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead>DRR</TableHead>
            <TableHead>DRR Value</TableHead>
            <TableHead>Days of Cover</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sales Loss Due to OOS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.sku || '-'}</TableCell>
              <TableCell>{row.inventory ?? '-'}</TableCell>
              <TableCell>{formatDrr(row.drr)}</TableCell>
              <TableCell>{formatCurrency(row.drrValue)}</TableCell>
              <TableCell>{formatDaysOfCover(row.daysOfCover)}</TableCell>
              <TableCell>
                <Badge
                  variant={row.status === 'Out of Stock' ? 'destructive' : 'secondary'}
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(row.salesLossDueToOos)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const TOTAL_INVENTORY_EXPORT_HEADERS = [
  'SKU',
  'Inventory',
  'DRR',
  'DRR Value',
  'Days of Cover',
  'Status',
  'Sales Loss Due to OOS',
];

export function totalInventoryExportFieldMap() {
  return {
    SKU: (item: TotalInventoryRow) => item.sku || '-',
    Inventory: (item: TotalInventoryRow) => String(item.inventory ?? '-'),
    DRR: (item: TotalInventoryRow) => formatDrr(item.drr),
    'DRR Value': (item: TotalInventoryRow) => formatCurrency(item.drrValue),
    'Days of Cover': (item: TotalInventoryRow) => formatDaysOfCover(item.daysOfCover),
    Status: (item: TotalInventoryRow) => item.status,
    'Sales Loss Due to OOS': (item: TotalInventoryRow) =>
      formatCurrency(item.salesLossDueToOos),
  };
}

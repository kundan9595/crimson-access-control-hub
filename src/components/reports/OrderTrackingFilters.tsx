import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  OrderTrackingReportTypeFilter,
  TriStateFilter,
} from '@/services/reports/orderTrackingReportService';

export type OrderTrackingFiltersState = {
  reportType: OrderTrackingReportTypeFilter;
  isOverdue: TriStateFilter;
  isFailed: TriStateFilter;
  isOos: TriStateFilter;
};

export const REPORT_TYPE_OPTIONS: { value: OrderTrackingReportTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'failed', label: 'Failed' },
  { value: 'completed', label: 'Completed' },
];

export const TRI_STATE_OPTIONS: { value: TriStateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

interface OrderTrackingFiltersProps {
  value: OrderTrackingFiltersState;
  onChange: (value: OrderTrackingFiltersState) => void;
}

export function OrderTrackingFilters({ value, onChange }: OrderTrackingFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Report Type</Label>
        <Select
          value={value.reportType}
          onValueChange={(v) =>
            onChange({ ...value, reportType: v as OrderTrackingReportTypeFilter })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Is Overdue</Label>
        <Select
          value={value.isOverdue}
          onValueChange={(v) => onChange({ ...value, isOverdue: v as TriStateFilter })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRI_STATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Is Failed</Label>
        <Select
          value={value.isFailed}
          onValueChange={(v) => onChange({ ...value, isFailed: v as TriStateFilter })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRI_STATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Is OOS</Label>
        <Select
          value={value.isOos}
          onValueChange={(v) => onChange({ ...value, isOos: v as TriStateFilter })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRI_STATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function createDefaultOrderTrackingFilters(): OrderTrackingFiltersState {
  return {
    reportType: 'pending',
    isOverdue: 'all',
    isFailed: 'all',
    isOos: 'all',
  };
}

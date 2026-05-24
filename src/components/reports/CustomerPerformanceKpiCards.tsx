import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UniqueCustomersSummary } from '@/services/reports/customerPerformanceReportService';

interface CustomerPerformanceKpiCardsProps {
  summary?: UniqueCustomersSummary;
  isLoading?: boolean;
}

function KpiCard({ label, value }: { label: string; value?: number }) {
  return (
    <Card className="border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">
          {value != null ? value.toLocaleString() : '-'}
        </p>
      </CardContent>
    </Card>
  );
}

export function CustomerPerformanceKpiCards({
  summary,
  isLoading,
}: CustomerPerformanceKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard label="Total unique Customer" value={summary?.totalUniqueCustomers} />
      <KpiCard label="Unique Customer (Custom Order)" value={summary?.uniqueCustomOrder} />
      <KpiCard label="Unique Customer (Readymade)" value={summary?.uniqueReadymade} />
    </div>
  );
}

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MONTH_OPTIONS,
  type RmpPeriodMode,
  type RmpSalesPeriodConfig,
  yearOptions,
} from '@/utils/rmpSalesPeriod';

interface RmpSalesPeriodFiltersProps {
  value: RmpSalesPeriodConfig;
  onChange: (config: RmpSalesPeriodConfig) => void;
}

export function RmpSalesPeriodFilters({ value, onChange }: RmpSalesPeriodFiltersProps) {
  const setMode = (mode: RmpPeriodMode) => onChange({ ...value, mode });
  const years = yearOptions(10);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-xs font-medium text-muted-foreground shrink-0">Period</Label>
        <Tabs value={value.mode} onValueChange={(v) => setMode(v as RmpPeriodMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="date" className="text-xs px-3">
              Date
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">
              Month
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-3">
              Year
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {value.mode === 'date' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={value.startDate}
                onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={value.endDate}
                onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              />
            </div>
          </>
        )}

        {value.mode === 'month' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select
                value={String(value.month)}
                onValueChange={(v) => onChange({ ...value, month: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select
                value={String(value.year)}
                onValueChange={(v) => onChange({ ...value, year: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {value.mode === 'year' && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Select
              value={String(value.year)}
              onValueChange={(v) => onChange({ ...value, year: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

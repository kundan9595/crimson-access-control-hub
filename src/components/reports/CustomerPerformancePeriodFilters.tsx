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
  GROWTH_TYPE_OPTIONS,
  MONTH_OPTIONS,
  createDefaultCustomerPerformancePeriod,
  createDefaultPeriodB,
  type CustomerPerformanceGrowthPeriod,
  type CustomerPerformancePeriodConfig,
  type CustomerPerformancePeriodMode,
  yearOptions,
} from '@/utils/customerPerformancePeriod';

interface PeriodPickerProps {
  label: string;
  value: CustomerPerformancePeriodConfig;
  onChange: (config: CustomerPerformancePeriodConfig) => void;
}

function PeriodPicker({ label, value, onChange }: PeriodPickerProps) {
  const setMode = (mode: CustomerPerformancePeriodMode) => onChange({ ...value, mode });
  const years = yearOptions(10);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Tabs value={value.mode} onValueChange={(v) => setMode(v as CustomerPerformancePeriodMode)}>
        <TabsList className="h-8">
          <TabsTrigger value="date" className="text-xs px-2">
            Date
          </TabsTrigger>
          <TabsTrigger value="week" className="text-xs px-2">
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="text-xs px-2">
            Month
          </TabsTrigger>
          <TabsTrigger value="year" className="text-xs px-2">
            Year
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-2 sm:grid-cols-2">
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

        {value.mode === 'week' && (
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Week</Label>
            <Input
              type="week"
              value={value.weekValue}
              onChange={(e) => onChange({ ...value, weekValue: e.target.value })}
            />
          </div>
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

export type CustomerPerformanceFiltersState = {
  growthPeriod: CustomerPerformanceGrowthPeriod;
  periodA: CustomerPerformancePeriodConfig;
  periodB: CustomerPerformancePeriodConfig;
};

interface CustomerPerformancePeriodFiltersProps {
  value: CustomerPerformanceFiltersState;
  onChange: (value: CustomerPerformanceFiltersState) => void;
}

export function CustomerPerformancePeriodFilters({
  value,
  onChange,
}: CustomerPerformancePeriodFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1 max-w-xs">
        <Label className="text-xs text-muted-foreground">Growth type</Label>
        <Select
          value={value.growthPeriod}
          onValueChange={(v) =>
            onChange({ ...value, growthPeriod: v as CustomerPerformanceGrowthPeriod })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROWTH_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <PeriodPicker
          label="Period A (baseline)"
          value={value.periodA}
          onChange={(periodA) => onChange({ ...value, periodA })}
        />
        <PeriodPicker
          label="Period B (comparison)"
          value={value.periodB}
          onChange={(periodB) => onChange({ ...value, periodB })}
        />
      </div>
    </div>
  );
}

export function createDefaultCustomerPerformanceFilters(): CustomerPerformanceFiltersState {
  return {
    growthPeriod: 'monthly',
    periodA: createDefaultPeriodB(),
    periodB: createDefaultCustomerPerformancePeriod(),
  };
}

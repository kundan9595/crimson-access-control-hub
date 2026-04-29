import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { config } from '@/config/environment';
import {
  getEffectiveScottApiBaseUrl,
  setStoredScottApiTarget,
  subscribeScottApiRuntime,
  type ScottApiRuntimeTarget,
} from '@/config/scottApiRuntime';

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function serverScottBaseUrl(): string {
  return normalizeBase(config.scottApi.baseUrl || config.scottApi.stagingBaseUrl);
}

/** Staging ↔ Production switch for Scott REST (persisted in localStorage; full page reload on change). */
export function ScottApiEnvBadge() {
  const baseUrl = useSyncExternalStore(
    subscribeScottApiRuntime,
    getEffectiveScottApiBaseUrl,
    serverScottBaseUrl,
  );

  const prod = normalizeBase(config.scottApi.productionBaseUrl);
  const isProduction = normalizeBase(baseUrl) === prod;

  const handleToggle = (checked: boolean) => {
    const target: ScottApiRuntimeTarget = checked ? 'production' : 'staging';
    setStoredScottApiTarget(target);
    toast.success(target === 'production' ? 'Scott production — reloading…' : 'Scott staging — reloading…');
    window.setTimeout(() => {
      window.location.reload();
    }, 350);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex shrink-0 cursor-default items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1"
          role="group"
          aria-label="Scott API environment"
        >
          <span
            className={cn(
              'select-none text-xs',
              isProduction ? 'text-muted-foreground' : 'font-medium text-foreground',
            )}
          >
            Staging
          </span>
          <Switch
            checked={isProduction}
            onCheckedChange={handleToggle}
            className="scale-90"
            aria-label="Switch Scott API to production when on, staging when off"
          />
          <span
            className={cn(
              'select-none text-xs',
              isProduction ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            Production
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-sm">
        <p className="text-xs text-muted-foreground">Scott REST base URL (saved in this browser)</p>
        <p className="break-all font-mono text-xs">{baseUrl}</p>
      </TooltipContent>
    </Tooltip>
  );
}

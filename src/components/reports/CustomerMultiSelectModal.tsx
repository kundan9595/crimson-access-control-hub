import { useEffect, useMemo, useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useScottCustomers } from '@/hooks/reports/useScottCustomers';
import {
  matchesScottCustomerSearch,
  type ScottCustomerOption,
} from '@/services/reports/scottCustomersService';

interface CustomerMultiSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export function CustomerMultiSelectModal({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
}: CustomerMultiSelectModalProps) {
  const [search, setSearch] = useState('');
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
      setSearch('');
    }
  }, [open, selectedIds]);

  const { data: customers = [], isLoading, error, isError } = useScottCustomers(open);

  const selectedSet = useMemo(() => new Set(draftIds), [draftIds]);

  const visibleCustomers = useMemo(() => {
    const matching = customers.filter((customer) => matchesScottCustomerSearch(customer, search));
    if (!search.trim()) return matching;

    const matchingIds = new Set(matching.map((c) => c.id));
    const selectedNotShown = customers.filter(
      (c) => selectedSet.has(c.id) && !matchingIds.has(c.id),
    );

    return [...selectedNotShown, ...matching];
  }, [customers, search, selectedSet]);

  const toggleCustomer = (id: string) => {
    setDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(draftIds);
    onOpenChange(false);
  };

  const handleClear = () => setDraftIds([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select customers
          </DialogTitle>
          <DialogDescription>
            Search and select one or more customers to filter the report.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {draftIds.length > 0 && (
            <>
              <span>Selected:</span>
              <Badge variant="secondary">{draftIds.length}</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleClear}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
              <span className="text-border">|</span>
            </>
          )}
          {!isLoading && !isError && (
            <span>
              {search.trim()
                ? `${visibleCustomers.length} match${visibleCustomers.length === 1 ? '' : 'es'}`
                : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
            </span>
          )}
        </div>

        <ScrollArea className="h-[320px] rounded-md border">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <p className="p-6 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load customers.'}
            </p>
          ) : visibleCustomers.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {search.trim()
                ? `No customers found matching "${search.trim()}".`
                : 'No customers found.'}
            </p>
          ) : (
            <ul className="divide-y">
              {visibleCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  checked={selectedSet.has(customer.id)}
                  onToggle={() => toggleCustomer(customer.id)}
                  pinned={selectedSet.has(customer.id) && !matchesScottCustomerSearch(customer, search)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Apply selection{draftIds.length > 0 ? ` (${draftIds.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerRow({
  customer,
  checked,
  onToggle,
  pinned,
}: {
  customer: ScottCustomerOption;
  checked: boolean;
  onToggle: () => void;
  pinned?: boolean;
}) {
  return (
    <li className={pinned ? 'bg-muted/30' : undefined}>
      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-muted/50">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{customer.company_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[customer.customer_code, customer.contact_person, customer.customer_type]
              .filter(Boolean)
              .join(' · ') || `ID ${customer.id}`}
          </p>
        </div>
      </label>
    </li>
  );
}

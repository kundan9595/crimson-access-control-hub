import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useRmpPrices, useAllRmpPrices, useCreateRmpPrice, useUpdateRmpPrice, useDeleteRmpPrice } from '@/hooks/masters/useRmpPrices';
import { useAllRmpSkus } from '@/hooks/masters/useRmpSkus';
import { useAllRmpPriceTypes } from '@/hooks/masters/useRmpPriceTypes';
import type { RmpPrice } from '@/services/masters/rmpPricesService';
import { DollarSign, Edit, Trash2, Activity, CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import {
  fetchRmpPrices,
  fetchRmpPricesPaginated,
} from '@/services/masters/rmpPricesService';
import {
  runRmpPricesBulkImport,
  fetchRmpPricesBulkUploadStatus,
  type RmpPricesBulkUploadStatus,
} from '@/services/masters/rmpPricesBulkUpload';
import { config } from '@/config/environment';
import { openBulkEditTab, BulkImportFromConfigDialog, type ServerBulkImportConfig } from '@/components/masters/bulk-edit';
import {
  buildRmpPricesColumns,
  rmpPricesGetRowId,
  rmpPricesCreateEmptyRow,
  rmpPricesToCreatePayload,
  rmpPricesToUpdatePayload,
  rmpPricesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpPricesConfig';
import { AdvancedFilterPanel } from '@/components/masters/advanced-filter/AdvancedFilterPanel';
import { buildFilterColumns } from '@/components/masters/advanced-filter/types';
import { useAdvancedFilter } from '@/hooks/masters/useAdvancedFilter';
import { QuickFilterBar } from '@/components/masters/advanced-filter/QuickFilterBar';
import { useQuickFilters } from '@/hooks/masters/useQuickFilters';

const PHASE_CONFIG = {
  idle:       { label: 'Idle',       icon: Clock,         className: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending:    { label: 'Pending',    icon: Clock,         className: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Processing', icon: Loader2,       className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:  { label: 'Completed',  icon: CheckCircle2,  className: 'bg-green-50 text-green-700 border-green-200' },
  failed:     { label: 'Failed',     icon: XCircle,       className: 'bg-red-50 text-red-700 border-red-200' },
} as const;

const UploadPhaseBadge: React.FC<{ phase: string }> = ({ phase }) => {
  const cfg = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG] ?? PHASE_CONFIG.idle;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 ${cfg.className}`}>
      <Icon className={`h-3.5 w-3.5 ${phase === 'processing' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </Badge>
  );
};

const StatCell: React.FC<{ label: string; value: number; className?: string }> = ({ label, value, className }) => (
  <div className="flex flex-col rounded-md border px-3 py-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-lg font-semibold tabular-nums ${className ?? ''}`}>{value.toLocaleString()}</span>
  </div>
);

const RmpPricesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { filterGroup, setFilterGroup, isActive: filterActive, applyFilter, clearFilters } = useAdvancedFilter();
  const { values: quickValues, setEnumFilter, setDateRange, clearFilter: clearQuickFilter, clearAll: clearAllQuick, isActive: quickFilterActive, applyQuickFilters } = useQuickFilters();
  const isAnyFilterActive = filterActive || quickFilterActive;

  const { data: pageData, isLoading, isFetching } = useRmpPrices(
    page, pageSize,
    isAnyFilterActive ? undefined : (search ? { search } : undefined)
  );
  const { data: allRmpPrices = [], isLoading: isLoadingAll } = useAllRmpPrices({ enabled: isAnyFilterActive });

  const createMut = useCreateRmpPrice();
  const updateMut = useUpdateRmpPrice();
  const deleteMut = useDeleteRmpPrice();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpPrice | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [rmpSkuId, setRmpSkuId] = useState('');
  const [rmpPriceTypeId, setRmpPriceTypeId] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<RmpPricesBulkUploadStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusCheckedAt, setStatusCheckedAt] = useState<Date | null>(null);

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusOpen(true);
    try {
      const status = await fetchRmpPricesBulkUploadStatus();
      setUploadStatus(status);
      setStatusCheckedAt(new Date());
    } catch {
      setUploadStatus(null);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const { data: rmpSkus = [], isLoading: isLoadingSkus } = useAllRmpSkus({
    enabled: importOpen || open || isAnyFilterActive,
  });
  const { data: rmpPriceTypes = [], isLoading: isLoadingPriceTypes } = useAllRmpPriceTypes({
    enabled: importOpen || open || isAnyFilterActive,
  });

  const importColumns = useMemo(() => {
    const rmpSkuOptions = rmpSkus.map((s) => ({ value: s.id, label: s.name }));
    const rmpSkuEditorOptions = rmpSkus
      .filter((s) => s.status === 'active')
      .map((s) => ({ value: s.id, label: s.name }));
    const rmpPriceTypeOptions = rmpPriceTypes.map((p) => ({ value: p.id, label: p.name }));
    const rmpPriceTypeEditorOptions = rmpPriceTypes
      .filter((p) => p.status === 'active')
      .map((p) => ({ value: p.id, label: p.name }));
    return buildRmpPricesColumns({
      rmpSkuOptions,
      rmpSkuEditorOptions,
      rmpPriceTypeOptions,
      rmpPriceTypeEditorOptions,
    });
  }, [rmpSkus, rmpPriceTypes]);

  const filterColumns = useMemo(() => buildFilterColumns(importColumns), [importColumns]);

  const filteredRows = useMemo(
    () => (isAnyFilterActive ? applyQuickFilters(applyFilter(allRmpPrices, filterColumns), filterColumns) : []),
    [isAnyFilterActive, allRmpPrices, applyFilter, applyQuickFilters, filterColumns],
  );

  const rows = useMemo(() => {
    if (isAnyFilterActive) return filteredRows.slice((page - 1) * pageSize, page * pageSize);
    return pageData?.data ?? [];
  }, [isAnyFilterActive, filteredRows, pageData, page, pageSize]);

  const clientPaginationResult = useMemo(() => {
    if (!isAnyFilterActive) return null;
    return {
      page,
      pageSize,
      totalCount: filteredRows.length,
      totalPages: Math.max(1, Math.ceil(filteredRows.length / pageSize)),
      totalCountIsExact: true as const,
      data: rows,
    };
  }, [isAnyFilterActive, filteredRows, rows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, isAnyFilterActive]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, isAnyFilterActive, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = isAnyFilterActive ? filteredRows.length : (pageData?.totalCount ?? rows.length);

  const fetchAllMatchingIds = useCallback(
    () =>
      isAnyFilterActive
        ? Promise.resolve(filteredRows.map((r) => r.id))
        : fetchAllRecordIds((pp) =>
            fetchRmpPricesPaginated(pp, search ? { search } : undefined),
          ),
    [isAnyFilterActive, filteredRows, search],
  );

  const serverBulkImport = useMemo<ServerBulkImportConfig>(
    () => ({
      importFile: (file, options) =>
        runRmpPricesBulkImport(file, {
          replaceAll: options?.replaceAll,
          signal: options?.signal,
        }),
    }),
    [],
  );

  const handleExport = async () => {
    const all = await fetchRmpPrices();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-prices'),
      headers: ['Name', 'Price', 'MRP', 'RMP SKU', 'Price Type', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        Name: 'name',
        Price: 'price',
        MRP: 'mrp',
        'RMP SKU': (item: RmpPrice) => item.rmp_sku?.name || '-',
        'Price Type': (item: RmpPrice) => rmpPriceTypes.find(pt => pt.id === item.rmp_price_type_id)?.name || '-',
        Status: 'status',
        'Created At': (item: RmpPrice) => new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPrice(0);
    setMrp(0);
    setRmpSkuId('');
    setRmpPriceTypeId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpPrice) => {
    setEditing(r);
    setName(r.name);
    setPrice(r.price);
    setMrp(r.mrp);
    setRmpSkuId(r.rmp_sku_id || '');
    setRmpPriceTypeId(r.rmp_price_type_id || '');
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim() || !rmpSkuId.trim() || !rmpPriceTypeId.trim()) return;
    const data: Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'> = {
      name: name.trim(),
      price,
      mrp,
      rmp_sku_id: rmpSkuId,
      rmp_price_type_id: rmpPriceTypeId,
      status,
      is_deleted: status === 'inactive',
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, updates: data }, { onSuccess: () => setOpen(false) });
    } else {
      createMut.mutate(data, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP Prices"
        description="Price rows linked to RMP SKUs and Scott price types"
        icon={<DollarSign className="h-6 w-6 text-amber-600" />}
        onAdd={openCreate}
        onBulkEdit={() => openBulkEditTab('/masters/rmp-prices/bulk-edit')}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchFilter
              placeholder="Search prices..."
              value={search}
              onChange={setSearch}
              resultCount={rows.length}
              totalCount={listTotal}
            />
            <AdvancedFilterPanel columns={filterColumns} filterGroup={filterGroup} onChange={setFilterGroup} onClear={clearFilters} />
            <QuickFilterBar columns={filterColumns} values={quickValues} onEnumChange={setEnumFilter} onDateChange={setDateRange} onClearField={clearQuickFilter} onClearAll={clearAllQuick} />
            {isAnyFilterActive && <span className="text-xs text-muted-foreground">{filteredRows.length} filtered result{filteredRows.length !== 1 ? 's' : ''}</span>}
            <div className="ml-auto">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckStatus}
                      disabled={isCheckingStatus}
                      className="gap-2 text-muted-foreground"
                    >
                      {isCheckingStatus
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Activity className="h-4 w-4" />
                      }
                      Bulk Upload Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Check the latest CSV bulk upload status</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP prices"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_prices', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_prices'] });
              }}
            />
          )}
          {isLoading || isLoadingAll ? (
            <MasterTableSkeleton showToolbar={false} columnCount={10} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isAnyFilterActive ? 'No prices match your filters' : search ? 'No prices match your search' : 'No prices found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox
                      checked={bulk.pageHeaderChecked(pageRowIds)}
                      onCheckedChange={() => bulk.togglePageHeader(pageRowIds)}
                      disabled={rows.length === 0}
                      aria-label="Select all rows on this page"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="w-10 p-2 align-middle">
                      <Checkbox
                        checked={bulk.selectedIds.has(r.id)}
                        onCheckedChange={() => bulk.toggleRow(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.price}</TableCell>
                    <TableCell>{r.mrp}</TableCell>
                    <TableCell>{r.rmp_sku?.name || '-'}</TableCell>
                    <TableCell>
                      {rmpPriceTypes.find(pt => pt.id === r.rmp_price_type_id)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          if (confirm('Delete this price?')) deleteMut.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <MasterServerPagination
            result={isAnyFilterActive ? clientPaginationResult : (pageData ?? null)}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            disabled={isLoading || isFetching || isLoadingAll}
            className="mt-6"
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit price' : 'Add price'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Price label / prefix" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>MRP</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>RMP SKU</Label>
              <Select value={rmpSkuId} onValueChange={setRmpSkuId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show current value first if not in active list (e.g., inactive SKU) */}
                  {rmpSkuId && !rmpSkus.find(s => s.id === rmpSkuId) && editing?.rmp_sku && (
                    <SelectItem value={rmpSkuId}>
                      {editing.rmp_sku.name} (Inactive)
                    </SelectItem>
                  )}
                  {rmpSkus.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RMP Price Type</Label>
              <Select value={rmpPriceTypeId} onValueChange={setRmpPriceTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show current value first if not in active list (e.g., inactive price type) */}
                  {rmpPriceTypeId && !rmpPriceTypes.find(pt => pt.id === rmpPriceTypeId) && editing?.rmp_price_type && (
                    <SelectItem value={rmpPriceTypeId}>
                      {editing.rmp_price_type.name} {editing.rmp_price_type.price_for ? `(${editing.rmp_price_type.price_for})` : ''} (Inactive)
                    </SelectItem>
                  )}
                  {rmpPriceTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.name} ({pt.price_for})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={
                !name.trim() ||
                !rmpSkuId ||
                !rmpPriceTypeId.trim() ||
                createMut.isPending ||
                updateMut.isPending
              }
            >
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-600" />
              Bulk Upload Status
            </DialogTitle>
          </DialogHeader>

          {isCheckingStatus ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Fetching status…</p>
            </div>
          ) : !uploadStatus ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Could not fetch status. Try again.</p>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Phase badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Phase</span>
                <UploadPhaseBadge phase={uploadStatus.phase} />
              </div>

              {/* Message */}
              {uploadStatus.message && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  {uploadStatus.message}
                </p>
              )}

              {/* Progress bar */}
              {uploadStatus.progress != null && uploadStatus.phase !== 'idle' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{uploadStatus.progress}%</span>
                  </div>
                  <Progress value={uploadStatus.progress} className="h-2" />
                </div>
              )}

              {/* Stats grid */}
              {(uploadStatus.total != null || uploadStatus.created != null || uploadStatus.updated != null || uploadStatus.failed != null || uploadStatus.skipped != null) && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadStatus.total != null && (
                    <StatCell label="Total rows" value={uploadStatus.total} />
                  )}
                  {uploadStatus.processed != null && (
                    <StatCell label="Processed" value={uploadStatus.processed} />
                  )}
                  {uploadStatus.created != null && (
                    <StatCell label="Created" value={uploadStatus.created} className="text-green-600" />
                  )}
                  {uploadStatus.updated != null && (
                    <StatCell label="Updated" value={uploadStatus.updated} className="text-blue-600" />
                  )}
                  {uploadStatus.skipped != null && (
                    <StatCell label="Skipped" value={uploadStatus.skipped} className="text-amber-600" />
                  )}
                  {uploadStatus.failed != null && (
                    <StatCell label="Failed" value={uploadStatus.failed} className="text-red-600" />
                  )}
                </div>
              )}

              {/* Failure list */}
              {uploadStatus.failures.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Row Failures</p>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-md border p-2">
                    {uploadStatus.failures.map((f, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        {f.rowNumber != null && (
                          <span className="shrink-0 font-mono text-muted-foreground">Row {f.rowNumber}</span>
                        )}
                        <span className="text-red-600">{f.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checked at timestamp */}
              {statusCheckedAt && (
                <p className="text-xs text-muted-foreground text-right">
                  Checked at {statusCheckedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCheckStatus} disabled={isCheckingStatus} size="sm">
              {isCheckingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
            <Button onClick={() => setStatusOpen(false)} size="sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportFromConfigDialog<RmpPrice, ReturnType<typeof rmpPricesToCreatePayload>, ReturnType<typeof rmpPricesToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Prices"
        filenameStem="rmp-prices"
        columns={importColumns}
        columnsLoading={isLoadingSkus || isLoadingPriceTypes}
        createEmptyRow={rmpPricesCreateEmptyRow}
        toCreatePayload={rmpPricesToCreatePayload}
        toUpdatePayload={rmpPricesToUpdatePayload}
        queryKey={rmpPricesQueryKey}
        serverBulkImport={serverBulkImport}
        getRowId={rmpPricesGetRowId}
        matchEnumKeysByValueId
      />
    </div>
  );
};

export default RmpPricesPage;

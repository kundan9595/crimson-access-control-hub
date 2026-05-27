import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import {
  useRmpPriceTypes,
  useAllRmpPriceTypes,
  useCreateRmpPriceType,
  useUpdateRmpPriceType,
  useDeleteRmpPriceType,
} from '@/hooks/masters/useRmpPriceTypes';
import type { RmpPriceType, PriceForType } from '@/services/masters/rmpPriceTypesService';
import { DollarSign, Edit, Trash2 } from 'lucide-react';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  rmpPriceTypesColumns,
  rmpPriceTypesGetRowId,
  rmpPriceTypesCreateEmptyRow,
  rmpPriceTypesToCreatePayload,
  rmpPriceTypesToUpdatePayload,
  rmpPriceTypesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpPriceTypesConfig';
import {
  createRmpPriceType,
  updateRmpPriceType,
  fetchRmpPriceTypes,
  fetchRmpPriceTypesPaginated,
} from '@/services/masters/rmpPriceTypesService';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { AdvancedFilterPanel } from '@/components/masters/advanced-filter/AdvancedFilterPanel';
import { buildFilterColumns } from '@/components/masters/advanced-filter/types';
import { useAdvancedFilter } from '@/hooks/masters/useAdvancedFilter';
import { QuickFilterBar } from '@/components/masters/advanced-filter/QuickFilterBar';
import { useQuickFilters } from '@/hooks/masters/useQuickFilters';

const RmpPriceTypesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { filterGroup, setFilterGroup, isActive: filterActive, applyFilter, clearFilters } = useAdvancedFilter();
  const { values: quickValues, setEnumFilter, setDateRange, clearFilter: clearQuickFilter, clearAll: clearAllQuick, isActive: quickFilterActive, applyQuickFilters } = useQuickFilters();
  const isAnyFilterActive = filterActive || quickFilterActive;
  const filterColumns = useMemo(() => buildFilterColumns(rmpPriceTypesColumns), []);

  const { data: pageData, isLoading, isFetching } = useRmpPriceTypes(
    page, pageSize,
    isAnyFilterActive ? undefined : (search ? { search } : undefined)
  );
  const { data: allRmpPriceTypes = [], isLoading: isLoadingAll } = useAllRmpPriceTypes({ enabled: isAnyFilterActive });

  const filteredRows = useMemo(
    () => (isAnyFilterActive ? applyQuickFilters(applyFilter(allRmpPriceTypes, filterColumns), filterColumns) : []),
    [isAnyFilterActive, allRmpPriceTypes, applyFilter, applyQuickFilters, filterColumns],
  );
  const rows = useMemo(() => {
    if (isAnyFilterActive) return filteredRows.slice((page - 1) * pageSize, page * pageSize);
    return pageData?.data ?? [];
  }, [isAnyFilterActive, filteredRows, pageData, page, pageSize]);
  const clientPaginationResult = useMemo(() => {
    if (!isAnyFilterActive) return null;
    return { page, pageSize, totalCount: filteredRows.length, totalPages: Math.max(1, Math.ceil(filteredRows.length / pageSize)), totalCountIsExact: true as const, data: rows };
  }, [isAnyFilterActive, filteredRows, rows, page, pageSize]);

  const createMut = useCreateRmpPriceType();
  const updateMut = useUpdateRmpPriceType();
  const deleteMut = useDeleteRmpPriceType();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpPriceType | null>(null);
  const [name, setName] = useState('');
  const [priceFor, setPriceFor] = useState<PriceForType>('zone');
  const [zoneId, setZoneId] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { setPage(1); }, [search, isAnyFilterActive]);
  useEffect(() => { bulk.clearSelection(); }, [search, isAnyFilterActive, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = isAnyFilterActive ? filteredRows.length : (pageData?.totalCount ?? rows.length);

  const fetchAllMatchingIds = useCallback(
    () => isAnyFilterActive
      ? Promise.resolve(filteredRows.map((r) => r.id))
      : fetchAllRecordIds((pp) => fetchRmpPriceTypesPaginated(pp, search ? { search } : undefined)),
    [isAnyFilterActive, filteredRows, search],
  );

  const handleExport = async () => {
    const all = await fetchRmpPriceTypes();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-price-types'),
      headers: ['Name', 'Price For', 'Zone ID', 'Zone', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        Name: 'name',
        'Price For': 'price_for',
        'Zone ID': 'zone_id',
        Zone: (item: RmpPriceType) => item.zone?.name || '-',
        Status: 'status',
        'Created At': (item: RmpPriceType) => new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPriceFor('zone');
    setZoneId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpPriceType) => {
    setEditing(r);
    setName(r.name);
    setPriceFor(r.price_for);
    setZoneId(r.zone_id);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim() || !zoneId.trim()) return;
    const data: Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'> = {
      name: name.trim(),
      price_for: priceFor,
      zone_id: zoneId,
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
        title="RMP Price Types"
        description="Price type definitions for RMP (customer, dealer, zone)"
        icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
        onAdd={openCreate}
        onBulkEdit={() => openBulkEditTab('/masters/rmp-price-types/bulk-edit')}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchFilter
              placeholder="Search price types..."
              value={search}
              onChange={setSearch}
              resultCount={rows.length}
              totalCount={listTotal}
            />
            <AdvancedFilterPanel columns={filterColumns} filterGroup={filterGroup} onChange={setFilterGroup} onClear={clearFilters} />
            <QuickFilterBar columns={filterColumns} values={quickValues} onEnumChange={setEnumFilter} onDateChange={setDateRange} onClearField={clearQuickFilter} onClearAll={clearAllQuick} />
            {isAnyFilterActive && <span className="text-xs text-muted-foreground">{filteredRows.length} filtered result{filteredRows.length !== 1 ? 's' : ''}</span>}
          </div>
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP price types"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_price_types', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_price_types'] });
              }}
            />
          )}
          {isLoading || isLoadingAll ? (
            <MasterTableSkeleton showToolbar={false} columnCount={9} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isAnyFilterActive ? 'No price types match your filters' : search ? 'No price types match your search' : 'No price types found'}
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
                  <TableHead>Price For</TableHead>
                  <TableHead>Zone ID</TableHead>
                  <TableHead>Zone</TableHead>
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
                    <TableCell className="capitalize">{r.price_for}</TableCell>
                    <TableCell className="font-mono text-xs">{r.zone_id}</TableCell>
                    <TableCell>{r.zone?.name || '-'}</TableCell>
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
                          if (confirm('Delete this price type?')) deleteMut.mutate(r.id);
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
            <DialogTitle>{editing ? 'Edit price type' : 'Add price type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Price type name" />
            </div>
            <div className="space-y-2">
              <Label>Price For</Label>
              <Select value={priceFor} onValueChange={(v) => setPriceFor(v as PriceForType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                  <SelectItem value="zone">Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zone ID (Scott)</Label>
              <Input
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                placeholder="Scott zone id (numeric)"
              />
              <p className="text-xs text-muted-foreground">
                Scott dashboard zone identifier (not app zones)
              </p>
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
                !name.trim() || !zoneId.trim() || createMut.isPending || updateMut.isPending
              }
            >
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportFromConfigDialog<RmpPriceType, ReturnType<typeof rmpPriceTypesToCreatePayload>, ReturnType<typeof rmpPriceTypesToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Price Types"
        filenameStem="rmp-price-types"
        columns={rmpPriceTypesColumns}
        createEmptyRow={rmpPriceTypesCreateEmptyRow}
        toCreatePayload={rmpPriceTypesToCreatePayload}
        toUpdatePayload={rmpPriceTypesToUpdatePayload}
        queryKey={rmpPriceTypesQueryKey}
        createMutation={async (payload) => {
          await createRmpPriceType({
            name: payload.name,
            price_for: payload.price_for,
            zone_id: payload.zone_id,
            status: payload.status,
            is_deleted: payload.is_deleted,
          });
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpPriceType(id, updates);
        }}
        fetchAll={fetchRmpPriceTypes}
        getRowId={rmpPriceTypesGetRowId}
      />

    </div>
  );
};

export default RmpPriceTypesPage;

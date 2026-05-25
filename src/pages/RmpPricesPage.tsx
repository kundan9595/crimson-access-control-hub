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
import { useRmpPrices, useCreateRmpPrice, useUpdateRmpPrice, useDeleteRmpPrice } from '@/hooks/masters/useRmpPrices';
import { useAllRmpSkus } from '@/hooks/masters/useRmpSkus';
import { useAllRmpPriceTypes } from '@/hooks/masters/useRmpPriceTypes';
import type { RmpPrice } from '@/services/masters/rmpPricesService';
import { DollarSign, Edit, Trash2 } from 'lucide-react';
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
import { runRmpPricesBulkImport } from '@/services/masters/rmpPricesBulkUpload';
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

const RmpPricesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: pageData, isLoading, isFetching } = useRmpPrices(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = pageData?.data ?? [];
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

  const { data: rmpSkus = [], isLoading: isLoadingSkus } = useAllRmpSkus({
    enabled: importOpen || open,
  });
  const { data: rmpPriceTypes = [], isLoading: isLoadingPriceTypes } = useAllRmpPriceTypes();

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = pageData?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        fetchRmpPricesPaginated(pp, search ? { search } : undefined),
      ),
    [search],
  );

  const serverBulkImport = useMemo<ServerBulkImportConfig>(
    () => ({
      importFile: (file, options) =>
        runRmpPricesBulkImport(file, {
          signal: options?.signal,
          onUploadComplete: () => {
            options?.onProgress?.({
              phase: 'uploading',
              completed: 0,
              total: 0,
              message: 'Upload complete. Processing on Scott…',
            });
          },
          onProgress: (status) => {
            options?.onProgress?.({
              phase:
                status.phase === 'pending' || status.phase === 'idle'
                  ? 'uploading'
                  : 'processing',
              completed: status.processed ?? 0,
              total: status.total ?? 0,
              message: status.message,
            });
          },
        }),
    }),
    [],
  );

  const importColumns = useMemo(() => {
    const t0 = performance.now();
    const rmpSkuOptions = rmpSkus.map((s) => ({ value: s.id, label: s.name }));
    const rmpSkuEditorOptions = rmpSkus
      .filter((s) => s.status === 'active')
      .map((s) => ({ value: s.id, label: s.name }));
    const rmpPriceTypeOptions = rmpPriceTypes.map((p) => ({ value: p.id, label: p.name }));
    const rmpPriceTypeEditorOptions = rmpPriceTypes
      .filter((p) => p.status === 'active')
      .map((p) => ({ value: p.id, label: p.name }));
    const cols = buildRmpPricesColumns({
      rmpSkuOptions,
      rmpSkuEditorOptions,
      rmpPriceTypeOptions,
      rmpPriceTypeEditorOptions,
    });
    return cols;
  }, [rmpSkus, rmpPriceTypes, isLoadingSkus, isLoadingPriceTypes]);

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
          <SearchFilter
            placeholder="Search prices..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={listTotal}
          />
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
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={10} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No prices match your search' : 'No prices found'}
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
            result={pageData ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isLoading || isFetching}
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
        defaultKeyFields={['rmp_sku_id', 'rmp_price_type_id']}
        matchEnumKeysByValueId
      />
    </div>
  );
};

export default RmpPricesPage;

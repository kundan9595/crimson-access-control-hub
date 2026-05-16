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
import { useRmpSkus, useCreateRmpSku, useUpdateRmpSku, useDeleteRmpSku } from '@/hooks/masters/useRmpSkus';
import { useAllRmpSizes } from '@/hooks/masters/useRmpSizes';
import { useAllRmpClasses, useAllRmpClassesForImport } from '@/hooks/masters/useRmpClasses';
import { useAllRmpBrands } from '@/hooks/masters/useRmpBrands';
import { useAllRmpCategories } from '@/hooks/masters/useRmpCategories';
import type { RmpSku } from '@/services/masters/rmpSkusService';
import { Package2, Edit, Trash2 } from 'lucide-react';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllScottPages } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpSkus, fetchRmpSkusForBulkImport, createRmpSku, updateRmpSku, fetchRmpSkusPaginated } from '@/services/masters/rmpSkusService';
import { fetchRmpSizes } from '@/services/masters/rmpSizesService';
import { fetchRmpClasses } from '@/services/masters/rmpClassesService';
import { fetchRmpBrands } from '@/services/masters/rmpBrandsService';
import { fetchRmpCategories } from '@/services/masters/rmpCategoriesService';
import { config } from '@/config/environment';
import { BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  buildRmpSkusColumns,
  rmpSkusGetRowId,
  rmpSkusCreateEmptyRow,
  rmpSkusToCreatePayload,
  rmpSkusToUpdatePayload,
  rmpSkusQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpSkusConfig';

/** Radix Select reserves empty string; use a sentinel for optional "None" rows. */
const SELECT_NONE = '__none__';

const RmpSkusPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpSkusPage, isLoading, isFetching } = useRmpSkus(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpSkusPage?.data ?? [];
  const createMut = useCreateRmpSku();
  const updateMut = useUpdateRmpSku();
  const deleteMut = useDeleteRmpSku();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();
  
  const { data: rmpSizes = [] } = useAllRmpSizes();
  const { data: rmpClasses = [] } = useAllRmpClasses();
  const { data: rmpClassesForImport = [], isLoading: isLoadingClassesForImport } = useAllRmpClassesForImport();
  const { data: rmpBrands = [] } = useAllRmpBrands();
  const { data: rmpCategories = [] } = useAllRmpCategories();

  const sizeById = useMemo(
    () => new Map(rmpSizes.map((s) => [s.id, s] as const)),
    [rmpSizes],
  );
  const classById = useMemo(
    () => new Map(rmpClasses.map((c) => [c.id, c] as const)),
    [rmpClasses],
  );
  const brandById = useMemo(
    () => new Map(rmpBrands.map((b) => [b.id, b] as const)),
    [rmpBrands],
  );
  const categoryById = useMemo(
    () => new Map(rmpCategories.map((c) => [c.id, c] as const)),
    [rmpCategories],
  );

  const resolveSizeLabel = (row: RmpSku) => {
    const full = row.rmp_size_id ? sizeById.get(row.rmp_size_id) : undefined;
    const sz = full ?? row.rmp_size;
    if (!sz) return '-';
    if ('size_type' in sz && sz.size_type) return `${sz.name} (${sz.size_type})`;
    return sz.name;
  };
  const resolveClassLabel = (row: RmpSku) => {
    const full = row.rmp_class_id ? classById.get(row.rmp_class_id) : undefined;
    const c = full ?? row.rmp_class;
    return c?.name ?? '-';
  };
  const resolveBrandLabel = (row: RmpSku) => {
    const full = row.rmp_brand_id ? brandById.get(row.rmp_brand_id) : undefined;
    const b = full ?? row.rmp_brand;
    return b?.name ?? '-';
  };
  const resolveCategoryLabel = (row: RmpSku) => {
    const full = row.rmp_category_id ? categoryById.get(row.rmp_category_id) : undefined;
    const c = full ?? row.rmp_category;
    return c?.name ?? '-';
  };

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpSku | null>(null);
  const [name, setName] = useState('');
  const [cgst, setCgst] = useState(0);
  const [igst, setIgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [rmpSizeId, setRmpSizeId] = useState('');
  const [rmpClassId, setRmpClassId] = useState('');
  const [rmpBrandId, setRmpBrandId] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = rmpSkusPage?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(async () => {
    const term = search.trim().toLowerCase();
    const allRows = await fetchAllScottPages((pp) => fetchRmpSkusPaginated(pp), {
      pageSize: 100,
      maxPages: 250,
    });
    if (!term) return allRows.map((r) => r.id);
    return allRows.filter((r) => r.name.toLowerCase().includes(term)).map((r) => r.id);
  }, [search]);

  const importColumns = useMemo(() => {
    const rmpSizeOptions = rmpSizes.map((s) => ({ value: s.id, label: s.name }));
    const rmpClassOptions = rmpClassesForImport.map((c) => ({ value: c.id, label: c.name }));
    const rmpBrandOptions = rmpBrands.map((b) => ({ value: b.id, label: b.name }));
    const rmpCategoryOptions = rmpCategories.map((c) => ({ value: c.id, label: c.name }));
    return buildRmpSkusColumns({
      rmpSizeOptions,
      rmpClassOptions,
      rmpBrandOptions,
      rmpCategoryOptions,
    });
  }, [rmpSizes, rmpClassesForImport, rmpBrands, rmpCategories]);

  const handleExport = async () => {
    const [all, sizes, classes, brands] = await Promise.all([
      fetchRmpSkus(),
      fetchRmpSizes(),
      fetchRmpClasses(),
      fetchRmpBrands(),
    ]);
    if (!all.length) return;

    const sizeMap = new Map(sizes.map((s) => [s.id, s] as const));
    const classMap = new Map(classes.map((c) => [c.id, c] as const));
    const brandMap = new Map(brands.map((b) => [b.id, b] as const));

    const sizeLabel = (item: RmpSku) => {
      const full = item.rmp_size_id ? sizeMap.get(item.rmp_size_id) : undefined;
      const sz = full ?? item.rmp_size;
      if (!sz) return '-';
      if ('size_type' in sz && sz.size_type) return `${sz.name} (${sz.size_type})`;
      return sz.name;
    };
    const classLabel = (item: RmpSku) => {
      const full = item.rmp_class_id ? classMap.get(item.rmp_class_id) : undefined;
      return full?.name ?? item.rmp_class?.name ?? '-';
    };
    const brandLabel = (item: RmpSku) => {
      const full = item.rmp_brand_id ? brandMap.get(item.rmp_brand_id) : undefined;
      return full?.name ?? item.rmp_brand?.name ?? '-';
    };

    exportToCSV({
      filename: generateExportFilename('rmp-skus'),
      headers: ['Name', 'CGST', 'IGST', 'SGST', 'Size', 'Class', 'Brand', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'CGST': 'cgst',
        'IGST': 'igst',
        'SGST': 'sgst',
        'Size': sizeLabel,
        'Class': classLabel,
        'Brand': brandLabel,
        'Status': 'status',
        'Created At': (item: RmpSku) => item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        'Updated At': (item: RmpSku) => item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCgst(0);
    setIgst(0);
    setSgst(0);
    setRmpSizeId('');
    setRmpClassId('');
    setRmpBrandId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpSku) => {
    setEditing(r);
    setName(r.name);
    setCgst(r.cgst);
    setIgst(r.igst);
    setSgst(r.sgst);
    setRmpSizeId(r.rmp_size_id || '');
    setRmpClassId(r.rmp_class_id || '');
    setRmpBrandId(r.rmp_brand_id || '');
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    const data = { 
      name: name.trim(), 
      cgst,
      igst,
      sgst,
      rmp_size_id: rmpSizeId || undefined,
      rmp_class_id: rmpClassId || undefined,
      rmp_brand_id: rmpBrandId || undefined,
      status,
      is_deleted: status === 'inactive',
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, updates: data },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMut.mutate(data, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP SKUs"
        description="Manage RMP SKUs with GST rates and product associations"
        icon={<Package2 className="h-6 w-6 text-emerald-700" />}
        onAdd={openCreate}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP SKUs..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={listTotal}
          />
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP SKUs"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_skus', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_skus'] });
              }}
            />
          )}
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={13} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP SKUs match your search' : 'No RMP SKUs found'}
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
                  <TableHead>Image</TableHead>
                  <TableHead>CGST</TableHead>
                  <TableHead>IGST</TableHead>
                  <TableHead>SGST</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
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
                    <TableCell>
                      {r.image ? (
                        <img
                          src={proxifyScottImageUrl(r.image)}
                          alt={r.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{r.cgst}%</TableCell>
                    <TableCell>{r.igst}%</TableCell>
                    <TableCell>{r.sgst}%</TableCell>
                    <TableCell>{resolveSizeLabel(r)}</TableCell>
                    <TableCell>{resolveClassLabel(r)}</TableCell>
                    <TableCell>{resolveBrandLabel(r)}</TableCell>
                    <TableCell>{resolveCategoryLabel(r)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell><DateCell date={r.created_at} /></TableCell>
                    <TableCell><DateCell date={r.updated_at} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          if (confirm('Delete this RMP SKU?')) deleteMut.mutate(r.id);
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
            result={rmpSkusPage ?? null}
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
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit RMP SKU' : 'Add RMP SKU'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter SKU name" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CGST (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cgst}
                  onChange={(e) => setCgst(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>IGST (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={igst}
                  onChange={(e) => setIgst(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>SGST (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={sgst}
                  onChange={(e) => setSgst(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={rmpSizeId || SELECT_NONE}
                onValueChange={(v) => setRmpSizeId(v === SELECT_NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a size (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
                  {rmpSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} ({size.size_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={rmpClassId || SELECT_NONE}
                onValueChange={(v) => setRmpClassId(v === SELECT_NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
                  {rmpClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={rmpBrandId || SELECT_NONE}
                onValueChange={(v) => setRmpBrandId(v === SELECT_NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
                  {rmpBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
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
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportFromConfigDialog<RmpSku, ReturnType<typeof rmpSkusToCreatePayload>, ReturnType<typeof rmpSkusToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP SKUs"
        filenameStem="rmp-skus"
        columns={importColumns}
        columnsLoading={isLoadingClassesForImport}
        createEmptyRow={rmpSkusCreateEmptyRow}
        toCreatePayload={rmpSkusToCreatePayload}
        toUpdatePayload={rmpSkusToUpdatePayload}
        queryKey={rmpSkusQueryKey}
        createMutation={async (payload) => {
          await createRmpSku({
            name: payload.name,
            cgst: payload.cgst,
            igst: payload.igst,
            sgst: payload.sgst,
            status: payload.status,
            is_deleted: payload.is_deleted,
            rmp_size_id: payload.rmp_size_id,
            rmp_class_id: payload.rmp_class_id,
            rmp_brand_id: payload.rmp_brand_id,
            rmp_category_id: payload.rmp_category_id,
          });
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpSku(id, updates);
        }}
        fetchAll={fetchRmpSkusForBulkImport}
        getRowId={rmpSkusGetRowId}
        defaultKeyFields={['name']}
      />
    </div>
  );
};

export default RmpSkusPage;

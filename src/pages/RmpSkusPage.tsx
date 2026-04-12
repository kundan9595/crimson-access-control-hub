import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useAllRmpClasses } from '@/hooks/masters/useRmpClasses';
import { useAllRmpBrands } from '@/hooks/masters/useRmpBrands';
import { useAllRmpCategories } from '@/hooks/masters/useRmpCategories';
import type { RmpSku } from '@/services/masters/rmpSkusService';
import { Package2, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpSkus } from '@/services/masters/rmpSkusService';
import { fetchRmpSizes } from '@/services/masters/rmpSizesService';
import { fetchRmpClasses } from '@/services/masters/rmpClassesService';
import { fetchRmpBrands } from '@/services/masters/rmpBrandsService';
import { config } from '@/config/environment';

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
  
  const { data: rmpSizes = [] } = useAllRmpSizes();
  const { data: rmpClasses = [] } = useAllRmpClasses();
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
    if (!sz) return row.rmp_size_id ?? '-';
    if ('size_type' in sz && sz.size_type) return `${sz.name} (${sz.size_type})`;
    return sz.name;
  };
  const resolveClassLabel = (row: RmpSku) => {
    const full = row.rmp_class_id ? classById.get(row.rmp_class_id) : undefined;
    const c = full ?? row.rmp_class;
    return c?.name ?? row.rmp_class_id ?? '-';
  };
  const resolveBrandLabel = (row: RmpSku) => {
    const full = row.rmp_brand_id ? brandById.get(row.rmp_brand_id) : undefined;
    const b = full ?? row.rmp_brand;
    return b?.name ?? row.rmp_brand_id ?? '-';
  };
  const resolveCategoryLabel = (row: RmpSku) => {
    const full = row.rmp_category_id ? categoryById.get(row.rmp_category_id) : undefined;
    const c = full ?? row.rmp_category;
    return c?.name ?? row.rmp_category_id ?? '-';
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

  useEffect(() => {
    setPage(1);
  }, [search]);

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
      if (!sz) return item.rmp_size_id ?? '-';
      if ('size_type' in sz && sz.size_type) return `${sz.name} (${sz.size_type})`;
      return sz.name;
    };
    const classLabel = (item: RmpSku) => {
      const full = item.rmp_class_id ? classMap.get(item.rmp_class_id) : undefined;
      return full?.name ?? item.rmp_class?.name ?? item.rmp_class_id ?? '-';
    };
    const brandLabel = (item: RmpSku) => {
      const full = item.rmp_brand_id ? brandMap.get(item.rmp_brand_id) : undefined;
      return full?.name ?? item.rmp_brand?.name ?? item.rmp_brand_id ?? '-';
    };

    exportToCSV({
      filename: generateExportFilename('rmp-skus'),
      headers: ['Name', 'CGST', 'IGST', 'SGST', 'Size', 'Class', 'Brand', 'Status', 'Created At'],
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
        'Created At': (item: RmpSku) => new Date(item.created_at).toLocaleDateString(),
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
            totalCount={rmpSkusPage?.totalCount ?? rows.length}
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={10} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP SKUs match your search' : 'No RMP SKUs found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      {r.image ? (
                        <img
                          src={r.image}
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
    </div>
  );
};

export default RmpSkusPage;

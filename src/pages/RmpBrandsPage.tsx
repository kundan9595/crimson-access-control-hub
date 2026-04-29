import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { useRmpBrands, useCreateRmpBrand, useUpdateRmpBrand, useDeleteRmpBrand } from '@/hooks/masters/useRmpBrands';
import { useAllBrands } from '@/hooks/masters/useBrands';
import { ImageCell } from '@/components/masters/shared/ImageCell';
import type { RmpBrand } from '@/services/masters/rmpBrandsService';
import { Package, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpBrands } from '@/services/masters/rmpBrandsService';
import { fetchBrands } from '@/services/masters/brandsService';
import { config } from '@/config/environment';

/** Radix Select reserves empty string; use a sentinel for optional "None" rows. */
const SELECT_NONE = '__none__';

const RmpBrandsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpBrandsPage, isLoading, isFetching } = useRmpBrands(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpBrandsPage?.data ?? [];
  const createMut = useCreateRmpBrand();
  const updateMut = useUpdateRmpBrand();
  const deleteMut = useDeleteRmpBrand();
  const { data: authorizedBrands = [] } = useAllBrands();

  const authorizedBrandById = useMemo(
    () => new Map(authorizedBrands.map((b) => [b.id, b] as const)),
    [authorizedBrands],
  );

  const resolveAuthorizedBrand = (row: RmpBrand) =>
    row.authorized_brand ??
    (row.authorized_brand_id ? authorizedBrandById.get(row.authorized_brand_id) : undefined);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpBrand | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [mainCategory, setMainCategory] = useState('');
  const [authorizedBrandId, setAuthorizedBrandId] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const [all, authBrands] = await Promise.all([fetchRmpBrands(), fetchBrands()]);
    if (!all.length) return;

    const exportById = new Map(authBrands.map((b) => [b.id, b] as const));

    const authorizedLabel = (item: RmpBrand) => {
      const ab =
        item.authorized_brand ??
        (item.authorized_brand_id ? exportById.get(item.authorized_brand_id) : undefined);
      return ab?.name ?? item.authorized_brand_id ?? '-';
    };

    exportToCSV({
      filename: generateExportFilename('rmp-brands'),
      headers: ['Name', 'Image', 'Position', 'Main Category', 'Authorized Brand', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Image': (item: RmpBrand) => item.image || '-',
        'Position': 'position',
        'Main Category': 'main_category',
        'Authorized Brand': authorizedLabel,
        'Status': 'status',
        'Created At': (item: RmpBrand) => new Date(item.created_at).toLocaleDateString(),
        'Updated At': (item: RmpBrand) => new Date(item.updated_at).toLocaleDateString(),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPosition(0);
    setMainCategory('');
    setAuthorizedBrandId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpBrand) => {
    setEditing(r);
    setName(r.name);
    setPosition(r.position);
    setMainCategory(r.main_category || '');
    setAuthorizedBrandId(r.authorized_brand_id || '');
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    const data = { 
      name: name.trim(), 
      position,
      main_category: mainCategory || undefined,
      authorized_brand_id: authorizedBrandId || undefined,
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
        title="RMP Brands"
        description="Ready Made Product brands. Link each to an authorized brand from the authorized brands master."
        icon={<Package className="h-6 w-6 text-blue-700" />}
        onAdd={openCreate}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <p className="text-sm text-muted-foreground -mt-2">
        Manage Scott authorized brands in{' '}
        <Link to="/masters/authorized-brands" className="text-primary font-medium underline-offset-4 hover:underline">
          Authorized Brands
        </Link>
        .
      </p>

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP brands..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={rmpBrandsPage?.totalCount ?? rows.length}
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={8} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP brands match your search' : 'No RMP brands found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Main Category</TableHead>
                  <TableHead>Authorized Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const authBrand = resolveAuthorizedBrand(r);
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <ImageCell src={r.image} alt={r.name} size="sm" />
                    </TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>{r.main_category || '-'}</TableCell>
                    <TableCell>
                      {authBrand ? (
                        <Link
                          to="/masters/authorized-brands"
                          className="text-primary font-medium underline-offset-4 hover:underline"
                          title="Open authorized brands master"
                        >
                          {authBrand.name}
                        </Link>
                      ) : r.authorized_brand_id ? (
                        <span className="text-muted-foreground text-xs font-mono">{r.authorized_brand_id}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                          if (confirm('Delete this RMP brand?')) deleteMut.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <MasterServerPagination
            result={rmpBrandsPage ?? null}
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
            <DialogTitle>{editing ? 'Edit RMP Brand' : 'Add RMP Brand'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter brand name" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                placeholder="Enter position"
              />
            </div>
            <div className="space-y-2">
              <Label>Main Category</Label>
              <Input 
                value={mainCategory} 
                onChange={(e) => setMainCategory(e.target.value)} 
                placeholder="Enter main category"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Authorized Brand</Label>
                <Link
                  to="/masters/authorized-brands"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Manage list
                </Link>
              </div>
              <Select
                value={authorizedBrandId || SELECT_NONE}
                onValueChange={(v) => setAuthorizedBrandId(v === SELECT_NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an authorized brand (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
                  {authorizedBrands.map((brand) => (
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

export default RmpBrandsPage;

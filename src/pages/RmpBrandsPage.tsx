import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useRmpBrands, useCreateRmpBrand, useUpdateRmpBrand, useDeleteRmpBrand } from '@/hooks/masters/useRmpBrands';
import { useAllBrands } from '@/hooks/masters/useBrands';
import { useAllRmpCategories } from '@/hooks/masters/useRmpCategories';
import { ImageCell } from '@/components/masters/shared/ImageCell';
import type { RmpBrand } from '@/services/masters/rmpBrandsService';
import { updateRmpBrandCategories, getRmpBrandById } from '@/services/masters/rmpBrandsService';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Package, Edit, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import {
  fetchRmpBrands,
  fetchRmpBrandsPaginated,
  createRmpBrand,
  updateRmpBrand,
} from '@/services/masters/rmpBrandsService';
import { fetchBrands } from '@/services/masters/brandsService';
import { config } from '@/config/environment';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  buildRmpBrandsColumns,
  rmpBrandsGetRowId,
  rmpBrandsCreateEmptyRow,
  rmpBrandsToCreatePayload,
  rmpBrandsToUpdatePayload,
  rmpBrandsQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpBrandsConfig';

/** Radix Select reserves empty string; use a sentinel for optional "None" rows. */
const SELECT_NONE = '__none__';

const rmpBrandDetailQueryKey = (id: string) => ['rmp_brands', 'detail', id] as const;

const RmpBrandsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpBrandsPage, isLoading, isFetching, error, isError } = useRmpBrands(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpBrandsPage?.data ?? [];

  const brandDetailQueries = useQueries({
    queries: rows.map((row) => ({
      queryKey: rmpBrandDetailQueryKey(row.id),
      queryFn: () => getRmpBrandById(row.id),
      enabled: Boolean(row.id),
      staleTime: config.cache.staleTime,
    })),
  });

  const brandCategoriesById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    rows.forEach((row, index) => {
      const detail = brandDetailQueries[index]?.data;
      map.set(row.id, detail?.rmp_categories ?? row.rmp_categories ?? []);
    });
    return map;
  }, [rows, brandDetailQueries]);

  const createMut = useCreateRmpBrand();
  const updateMut = useUpdateRmpBrand();
  const deleteMut = useDeleteRmpBrand();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();
  const { data: authorizedBrands = [] } = useAllBrands();

  const authorizedBrandById = useMemo(
    () => new Map(authorizedBrands.map((b) => [b.id, b] as const)),
    [authorizedBrands],
  );

  const resolveAuthorizedBrand = (row: RmpBrand) =>
    row.authorized_brand ??
    (row.authorized_brand_id ? authorizedBrandById.get(row.authorized_brand_id) : undefined);

  const { data: allCategories = [], isLoading: categoriesLoading } = useAllRmpCategories();

  const activeCategories = useMemo(
    () => allCategories.filter((c) => c.status === 'active'),
    [allCategories],
  );

  const activeCategoryIdSet = useMemo(
    () => new Set(activeCategories.map((c) => c.id)),
    [activeCategories],
  );

  const isActiveCategoryId = useCallback(
    (categoryId: string) => {
      if (activeCategoryIdSet.has(categoryId)) return true;
      const cat = allCategories.find((c) => c.id === categoryId);
      if (!cat) return categoriesLoading;
      return cat.status === 'active';
    },
    [activeCategoryIdSet, allCategories, categoriesLoading],
  );

  const visibleBrandCategories = useCallback(
    (categories: { id: string; name: string }[] | undefined) =>
      (categories ?? []).filter((c) => isActiveCategoryId(c.id)),
    [isActiveCategoryId],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpBrand | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [loadingBrandCategories, setLoadingBrandCategories] = useState(false);
  const [authorizedBrandId, setAuthorizedBrandId] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  const importColumns = useMemo(() => {
    const options = authorizedBrands.map((b) => ({ value: b.id, label: b.name }));
    return buildRmpBrandsColumns({
      authorizedBrandOptions: options,
      authorizedBrandEditorOptions: options,
    });
  }, [authorizedBrands]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = rmpBrandsPage?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        fetchRmpBrandsPaginated(pp, search ? { search } : undefined),
      ),
    [search],
  );

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
      headers: ['Name', 'Image', 'Position', 'Categories', 'Authorized Brand', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Image': (item: RmpBrand) => item.image || '-',
        'Position': 'position',
        'Categories': (item: RmpBrand) =>
          visibleBrandCategories(item.rmp_categories)
            .map((c) => c.name)
            .join(', ') || '-',
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
    setSelectedCategoryIds([]);
    setLoadingBrandCategories(false);
    setAuthorizedBrandId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpBrand) => {
    setEditing(r);
    setName(r.name);
    setPosition(r.position);
    const cachedDetail = queryClient.getQueryData<RmpBrand | null>(rmpBrandDetailQueryKey(r.id));
    const seed =
      cachedDetail?.rmp_categories?.map((c) => c.id) ??
      r.rmp_categories?.map((c) => c.id) ??
      [];
    setSelectedCategoryIds(seed);
    setLoadingBrandCategories(true);
    setAuthorizedBrandId(r.authorized_brand_id || '');
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);

    getRmpBrandById(r.id)
      .then((full) => {
        if (!full) return;
        queryClient.setQueryData(rmpBrandDetailQueryKey(r.id), full);
        setSelectedCategoryIds(full.rmp_categories?.map((c) => c.id) ?? []);
      })
      .catch(() => { /* non-fatal — seeded value stays */ })
      .finally(() => setLoadingBrandCategories(false));
  };

  const onSave = async () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      position,
      authorized_brand_id: authorizedBrandId || undefined,
      status,
      is_deleted: status === 'inactive',
    };
    const finalCategoryIds = [...new Set(selectedCategoryIds)];

    try {
      let brandId: string;
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, updates: data });
        brandId = editing.id;
      } else {
        const newBrand = (await createMut.mutateAsync(data)) as RmpBrand;
        brandId = newBrand.id;
      }

      try {
        await updateRmpBrandCategories(brandId, finalCategoryIds);
      } catch (categoryErr) {
        const detail = categoryErr instanceof Error ? categoryErr.message : String(categoryErr);
        toast.error(`Brand saved, but failed to update categories: ${detail}`);
        void queryClient.invalidateQueries({ queryKey: rmpBrandDetailQueryKey(brandId) });
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ['rmp_brands'] });
      void queryClient.invalidateQueries({ queryKey: rmpBrandDetailQueryKey(brandId) });
      setOpen(false);
    } catch {
      // Create/update mutation hooks already show error toasts.
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP Brands"
        description="Ready Made Product brands. Link each to an authorized brand from the authorized brands master."
        icon={<Package className="h-6 w-6 text-blue-700" />}
        onAdd={openCreate}
        onBulkEdit={() => openBulkEditTab('/masters/rmp-brands/bulk-edit')}
        onImport={() => setImportOpen(true)}
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
            totalCount={listTotal}
          />
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP brands"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_brands', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_brands'] });
              }}
            />
          )}
          {isError ? (
            <div className="mt-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Failed to load RMP brands</p>
              <p className="mt-1 text-xs opacity-80">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={9} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP brands match your search' : 'No RMP brands found'}
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
                  <TableHead>Position</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Authorized Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, rowIndex) => {
                  const authBrand = resolveAuthorizedBrand(r);
                  const categoriesLoading = brandDetailQueries[rowIndex]?.isLoading;
                  const displayCategories = visibleBrandCategories(brandCategoriesById.get(r.id));
                  return (
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
                      <ImageCell src={r.image} alt={r.name} size="sm" />
                    </TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>
                      {categoriesLoading ? (
                        <Skeleton className="h-5 w-24" />
                      ) : displayCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {displayCategories.map((c) => (
                            <Badge key={c.id} variant="secondary" className="text-xs font-normal">
                              {c.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
              <Label>Categories</Label>
              <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryPopoverOpen}
                    className="w-full justify-between h-auto min-h-10 font-normal"
                    disabled={categoriesLoading || loadingBrandCategories}
                  >
                    <div className="flex flex-wrap gap-1 py-0.5">
                      {loadingBrandCategories ? (
                        <span className="text-muted-foreground">Loading categories…</span>
                      ) : selectedCategoryIds.length === 0 ? (
                        <span className="text-muted-foreground">
                          {categoriesLoading ? 'Loading categories…' : 'Select categories…'}
                        </span>
                      ) : (
                        selectedCategoryIds.map((id) => {
                          const cat = allCategories.find((c) => c.id === id);
                          const label = cat?.name ?? id;
                          const inactive = cat && cat.status !== 'active';
                          return (
                            <Badge key={id} variant="secondary" className="text-xs gap-1">
                              {label}
                              {inactive ? ' (Inactive)' : ''}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategoryIds((prev) => prev.filter((i) => i !== id));
                                }}
                              />
                            </Badge>
                          );
                        })
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories…" />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {activeCategories.map((cat) => (
                          <CommandItem
                            key={cat.id}
                            value={cat.name}
                            onSelect={() => {
                              setSelectedCategoryIds((prev) =>
                                prev.includes(cat.id)
                                  ? prev.filter((id) => id !== cat.id)
                                  : [...prev, cat.id],
                              );
                            }}
                          >
                            <Check
                              className={cn(
                                'h-4 w-4 mr-2 shrink-0',
                                selectedCategoryIds.includes(cat.id) ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {cat.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  {/* Show current value if not in active list (e.g., inactive authorized brand) */}
                  {authorizedBrandId && !authorizedBrands.find(b => b.id === authorizedBrandId) && editing?.authorized_brand && (
                    <SelectItem value={authorizedBrandId}>
                      {editing.authorized_brand.name} (Inactive)
                    </SelectItem>
                  )}
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
            <Button
              onClick={() => void onSave()}
              disabled={
                !name.trim() ||
                createMut.isPending ||
                updateMut.isPending ||
                loadingBrandCategories
              }
            >
              {createMut.isPending || updateMut.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportFromConfigDialog<RmpBrand, ReturnType<typeof rmpBrandsToCreatePayload>, ReturnType<typeof rmpBrandsToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Brands"
        filenameStem="rmp-brands"
        columns={importColumns}
        createEmptyRow={rmpBrandsCreateEmptyRow}
        toCreatePayload={rmpBrandsToCreatePayload}
        toUpdatePayload={rmpBrandsToUpdatePayload}
        queryKey={rmpBrandsQueryKey}
        createMutation={async (payload) => {
          await createRmpBrand({
            name: payload.name,
            position: payload.position,
            authorized_brand_id: payload.authorized_brand_id,
            status: payload.status,
            is_deleted: payload.is_deleted,
            image: '',
          });
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpBrand(id, updates);
        }}
        fetchAll={fetchRmpBrands}
        getRowId={rmpBrandsGetRowId}
        defaultKeyFields={['name']}
      />
    </div>
  );
};

export default RmpBrandsPage;

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  useRmpCategories,
  useCreateRmpCategory,
  useUpdateRmpCategory,
  useDeleteRmpCategory,
} from '@/hooks/masters/useRmpCategories';
import type { RmpCategory } from '@/services/masters/rmpCategoriesService';
import { LayoutGrid, Edit, Trash2, RotateCcw } from 'lucide-react';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  rmpCategoriesColumns,
  rmpCategoriesGetRowId,
  rmpCategoriesCreateEmptyRow,
  rmpCategoriesToCreatePayload,
  rmpCategoriesToUpdatePayload,
  rmpCategoriesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpCategoriesConfig';
import { createRmpCategory, updateRmpCategory, fetchRmpCategories, fetchRmpCategoriesPaginated } from '@/services/masters/rmpCategoriesService';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { ImageCell } from '@/components/masters/shared/ImageCell';

const RmpCategoriesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data: pageData, isLoading, isFetching } = useRmpCategories(
    page,
    pageSize,
    { search: search || undefined, includeInactive: showInactive }
  );
  const rows = pageData?.data ?? [];
  const createMut = useCreateRmpCategory();
  const updateMut = useUpdateRmpCategory();
  const deleteMut = useDeleteRmpCategory();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpCategory | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState('active');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, showInactive]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, showInactive, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = pageData?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        fetchRmpCategoriesPaginated(pp, { search: search || undefined, includeInactive: showInactive }),
      ),
    [search, showInactive],
  );

  const handleExport = async () => {
    const all = await fetchRmpCategories();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-categories'),
      headers: ['Name', 'Position', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        Name: 'name',
        Position: 'position',
        Status: 'status',
        'Created At': (item: RmpCategory) => item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        'Updated At': (item: RmpCategory) => item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPosition(0);
    setStatus('active');
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setOpen(true);
  };

  const openEdit = (r: RmpCategory) => {
    setEditing(r);
    setName(r.name);
    setPosition(r.position);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    const data: Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> = {
      name: name.trim(),
      position,
      status,
      is_deleted: status === 'inactive',
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, updates: data, imageFile: imageFile ?? undefined },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMut.mutate(
        { data, imageFile: imageFile ?? undefined },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  const onReactivate = (r: RmpCategory) => {
    // Must include name + position — Scott API validates name uniqueness even on PATCH.
    updateMut.mutate(
      { id: r.id, updates: { name: r.name, position: r.position, status: 'active', is_deleted: false } },
    );
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP Product Categories"
        description="Ready Made Product categories (Scott dashboard)"
        icon={<LayoutGrid className="h-6 w-6 text-indigo-600" />}
        onAdd={openCreate}
        onBulkEdit={() => openBulkEditTab('/masters/rmp-categories/bulk-edit')}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <SearchFilter
              placeholder="Search categories..."
              value={search}
              onChange={setSearch}
              resultCount={rows.length}
              totalCount={listTotal}
            />
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                Show inactive
              </Label>
            </div>
          </div>
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP categories"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_categories', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_categories'] });
              }}
            />
          )}
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={8} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No categories match your search' : 'No categories found'}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className={r.is_deleted ? 'opacity-50' : undefined}>
                    <TableCell className="w-10 p-2 align-middle">
                      <Checkbox
                        checked={bulk.selectedIds.has(r.id)}
                        onCheckedChange={() => bulk.toggleRow(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <ImageCell src={r.image} alt={r.name} size="md" />
                    </TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell><DateCell date={r.created_at} /></TableCell>
                    <TableCell><DateCell date={r.updated_at} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      {r.is_deleted ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(r)}
                            title="Rename before reactivating if there's a name conflict"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => onReactivate(r)}
                            disabled={updateMut.isPending}
                            title="Reactivate this category"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm('Permanently delete this inactive category?')) deleteMut.mutate(r.id);
                            }}
                            disabled={deleteMut.isPending}
                            title="Delete this category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm('Delete this category?')) deleteMut.mutate(r.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
            <DialogTitle>{editing ? 'Edit category' : 'Add category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Image (optional)</Label>
              <Input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
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
                !name.trim() || createMut.isPending || updateMut.isPending
              }
            >
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportFromConfigDialog<RmpCategory, ReturnType<typeof rmpCategoriesToCreatePayload>, ReturnType<typeof rmpCategoriesToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Categories"
        filenameStem="rmp-categories"
        columns={rmpCategoriesColumns}
        createEmptyRow={rmpCategoriesCreateEmptyRow}
        toCreatePayload={rmpCategoriesToCreatePayload}
        toUpdatePayload={rmpCategoriesToUpdatePayload}
        queryKey={rmpCategoriesQueryKey}
        createMutation={async (payload) => {
          await createRmpCategory(payload);
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpCategory(id, updates);
        }}
        fetchAll={fetchRmpCategories}
        getRowId={rmpCategoriesGetRowId}
        defaultKeyFields={['name']}
      />
    </div>
  );
};

export default RmpCategoriesPage;

import React, { useState, useEffect, useRef } from 'react';
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
import {
  useRmpCategories,
  useCreateRmpCategory,
  useUpdateRmpCategory,
  useDeleteRmpCategory,
} from '@/hooks/masters/useRmpCategories';
import type { RmpCategory } from '@/services/masters/rmpCategoriesService';
import { LayoutGrid, Edit, Trash2 } from 'lucide-react';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  rmpCategoriesColumns,
  rmpCategoriesGetRowId,
  rmpCategoriesCreateEmptyRow,
  rmpCategoriesToCreatePayload,
  rmpCategoriesToUpdatePayload,
  rmpCategoriesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpCategoriesConfig';
import { createRmpCategory, updateRmpCategory } from '@/services/masters/rmpCategoriesService';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpCategories } from '@/services/masters/rmpCategoriesService';
import { config } from '@/config/environment';
import { ImageCell } from '@/components/masters/shared/ImageCell';

const RmpCategoriesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: pageData, isLoading, isFetching } = useRmpCategories(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = pageData?.data ?? [];
  const createMut = useCreateRmpCategory();
  const updateMut = useUpdateRmpCategory();
  const deleteMut = useDeleteRmpCategory();

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
  }, [search]);

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
          <SearchFilter
            placeholder="Search categories..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={pageData?.totalCount ?? rows.length}
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={7} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No categories match your search' : 'No categories found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
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
                  <TableRow key={r.id}>
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

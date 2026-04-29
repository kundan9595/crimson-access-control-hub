import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useSizeTypes, useCreateSizeType, useUpdateSizeType, useDeleteSizeType, type SizeTypeFilter } from '@/hooks/masters/useSizeTypes';
import type { SizeType } from '@/services/masters/sizeTypesService';
import { Ruler, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { fetchSizeTypes } from '@/services/masters/sizeTypesService';
import { config } from '@/config/environment';

const SizeTypesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');
  const filters: SizeTypeFilter | undefined = search ? { search } : undefined;
  const { data: sizeTypesPage, isLoading, isFetching } = useSizeTypes(page, pageSize, filters);
  const rows = sizeTypesPage?.data ?? [];
  const createMut = useCreateSizeType();
  const updateMut = useUpdateSizeType();
  const deleteMut = useDeleteSizeType();

  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<SizeType | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const all = await fetchSizeTypes();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('size-types'),
      headers: ['Name', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Status': 'status',
        'Created At': (item: SizeType) => item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        'Updated At': (item: SizeType) => item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
      },
    });
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: SizeType) => {
    setEditing(r);
    setName(r.name);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMut.mutate(
        { id: editing.id, updates: { name: name.trim(), status } },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMut.mutate({ name: name.trim(), status }, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Size types"
        description="Scott dashboard size types (separate from size groups)"
        icon={<Ruler className="h-6 w-6 text-orange-600" />}
        onAdd={openCreate}
        onExport={handleExport}
        onImport={handleImport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search size types..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={
              sizeTypesPage?.totalCountIsExact ? sizeTypesPage.totalCount : rows.length
            }
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={5} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{search ? 'No size types match your search' : 'No size types found'}</p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
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
                          if (confirm('Delete this size type?')) deleteMut.mutate(r.id);
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
            result={sizeTypesPage ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isFetching}
            className="mt-4"
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit size type' : 'Create size type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <Label>Status</Label>
              <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="st-a" />
                  <Label htmlFor="st-a">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="st-i" />
                  <Label htmlFor="st-i">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={createMut.isPending || updateMut.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        type="sizeTypes"
        templateHeaders={['Name', 'Status']}
        sampleData={[
          ['Small', 'active'],
          ['Medium', 'active'],
          ['Large', 'active'],
        ]}
      />
    </div>
  );
};

export default SizeTypesPage;

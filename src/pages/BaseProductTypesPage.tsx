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
import ImageUpload from '@/components/ui/ImageUpload';
import {
  useBaseProductTypes,
  useCreateBaseProductType,
  useUpdateBaseProductType,
  useDeleteBaseProductType,
} from '@/hooks/masters/useBaseProductTypes';
import type { BaseProductType } from '@/services/masters/baseProductTypesService';
import { fetchBaseProductTypes } from '@/services/masters/baseProductTypesService';
import { Package2, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { config } from '@/config/environment';

const BaseProductTypesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const { data: bptPage, isLoading, isFetching } = useBaseProductTypes(page, pageSize);
  const rows = bptPage?.data ?? [];
  const createMut = useCreateBaseProductType();
  const updateMut = useUpdateBaseProductType();
  const deleteMut = useDeleteBaseProductType();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<BaseProductType | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState('active');
  const [imageUrl, setImageUrl] = useState('');

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const all = await fetchBaseProductTypes();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('base-product-types'),
      headers: ['Name', 'Position', 'Image URL', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Position': (item: BaseProductType) => item.position?.toString() || '',
        'Image URL': (item: BaseProductType) => item.image_url || '',
        'Status': 'status',
        'Created At': (item: BaseProductType) => new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const handleImport = () => {
    setImportOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPosition(0);
    setStatus('active');
    setImageUrl('');
    setOpen(true);
  };

  const openEdit = (r: BaseProductType) => {
    setEditing(r);
    setName(r.name);
    setPosition(r.position ?? 0);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setImageUrl(r.image_url || '');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          updates: {
            name: name.trim(),
            status,
            position,
            image: imageUrl || undefined,
          },
        },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMut.mutate(
        {
          name: name.trim(),
          status,
          position,
          image: imageUrl || undefined,
        },
        { onSuccess: () => setOpen(false) },
      );
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Base product types"
        description="Scott dashboard base product types (taxonomy)"
        icon={<Package2 className="h-6 w-6 text-teal-600" />}
        onAdd={openCreate}
        onExport={handleExport}
        onImport={handleImport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search (current page)..."
            value={search}
            onChange={setSearch}
            resultCount={filtered.length}
            totalCount={
              bptPage?.totalCountIsExact ? bptPage.totalCount : rows.length
            }
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={4} className="mt-6" />
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No base product types on this page</p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.image_url ? (
                        <img src={r.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.position ?? '—'}</TableCell>
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
                          if (confirm('Delete this item?')) deleteMut.mutate(r.id);
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
            result={bptPage ?? null}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit base product type' : 'Create base product type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <Label>Image</Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onRemove={() => setImageUrl('')}
                placeholder="Upload image"
              />
            </div>
            <div>
              <Label>Status</Label>
              <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="bpt-a" />
                  <Label htmlFor="bpt-a">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inactive" id="bpt-i" />
                  <Label htmlFor="bpt-i">Inactive</Label>
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
        type="baseProductTypes"
        templateHeaders={['Name', 'Position', 'Image URL', 'Status']}
        sampleData={[
          ['Shirts', '1', 'https://example.com/shirts.png', 'active'],
          ['T-Shirts', '2', 'https://example.com/tshirts.png', 'active'],
          ['Pants', '3', '', 'active'],
        ]}
      />
    </div>
  );
};

export default BaseProductTypesPage;

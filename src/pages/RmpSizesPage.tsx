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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useRmpSizes, useCreateRmpSize, useUpdateRmpSize, useDeleteRmpSize } from '@/hooks/masters/useRmpSizes';
import type { RmpSize, RmpSizeType } from '@/services/masters/rmpSizesService';
import { Ruler, Edit, Trash2 } from 'lucide-react';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpSizes } from '@/services/masters/rmpSizesService';
import { config } from '@/config/environment';

const RmpSizesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpSizesPage, isLoading, isFetching } = useRmpSizes(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpSizesPage?.data ?? [];
  const createMut = useCreateRmpSize();
  const updateMut = useUpdateRmpSize();
  const deleteMut = useDeleteRmpSize();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpSize | null>(null);
  const [name, setName] = useState('');
  const [sizeType, setSizeType] = useState<RmpSizeType>('alpha');
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState('active');

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const all = await fetchRmpSizes();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-sizes'),
      headers: ['Name', 'Size Type', 'Position', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Size Type': 'size_type',
        'Position': 'position',
        'Status': 'status',
        'Created At': (item: RmpSize) => item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        'Updated At': (item: RmpSize) => item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSizeType('alpha');
    setPosition(0);
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpSize) => {
    setEditing(r);
    setName(r.name);
    setSizeType(r.size_type);
    setPosition(r.position);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    const data = { 
      name: name.trim(), 
      size_type: sizeType,
      position,
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

  const sizeTypeOptions: { value: RmpSizeType; label: string }[] = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'numeric', label: 'Numeric' },
    { value: 'free_size', label: 'Free Size' },
    { value: 'kids', label: 'Kids' },
    { value: 'bags', label: 'Bags' },
  ];

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP Sizes"
        description="Configure size types for RMP products (alpha, numeric, free_size, kids, bags)"
        icon={<Ruler className="h-6 w-6 text-orange-700" />}
        onAdd={openCreate}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP sizes..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={rmpSizesPage?.totalCount ?? rows.length}
          />
              {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={7} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP sizes match your search' : 'No RMP sizes found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Size Type</TableHead>
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
                    <TableCell>
                      <Badge variant="outline">{r.size_type}</Badge>
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
                          if (confirm('Delete this RMP size?')) deleteMut.mutate(r.id);
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
            result={rmpSizesPage ?? null}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit RMP Size' : 'Add RMP Size'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter size name" />
            </div>
            <div className="space-y-2">
              <Label>Size Type</Label>
              <Select value={sizeType} onValueChange={(v) => setSizeType(v as RmpSizeType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default RmpSizesPage;

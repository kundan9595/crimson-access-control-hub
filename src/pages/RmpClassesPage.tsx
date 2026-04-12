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
import { useRmpClasses, useCreateRmpClass, useUpdateRmpClass, useDeleteRmpClass } from '@/hooks/masters/useRmpClasses';
import { useAllRmpColors } from '@/hooks/masters/useRmpColors';
import type { RmpClass } from '@/services/masters/rmpClassesService';
import { Shirt, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpClasses } from '@/services/masters/rmpClassesService';
import { config } from '@/config/environment';

const RmpClassesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const { data: rmpClassesPage, isLoading, isFetching } = useRmpClasses(page, pageSize);
  const rows = rmpClassesPage?.data ?? [];
  const createMut = useCreateRmpClass();
  const updateMut = useUpdateRmpClass();
  const deleteMut = useDeleteRmpClass();
  const { data: rmpColors = [] } = useAllRmpColors();

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpClass | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [rmpColorId, setRmpColorId] = useState('');
  const [status, setStatus] = useState('active');

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const all = await fetchRmpClasses();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-classes'),
      headers: ['Name', 'Position', 'Color', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Position': 'position',
        'Color': (item: RmpClass) => item.rmp_color?.name || item.rmp_color_id || '-',
        'Status': 'status',
        'Created At': (item: RmpClass) => new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPosition(0);
    setRmpColorId('');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpClass) => {
    setEditing(r);
    setName(r.name);
    setPosition(r.position);
    setRmpColorId(r.rmp_color_id || '');
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim()) return;
    const data = { 
      name: name.trim(), 
      position,
      rmp_color_id: rmpColorId || undefined,
      status,
      is_deleted: status === 'inactive',
    };
    if (editing) {
      updateMut.mutate(
        { id: editing.id, updates: data },
        { onSuccess: () => setOpen(false) },
      );
    } else {
      createMut.mutate({ data }, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="RMP Classes"
        description="Manage RMP product classes with multiple image support"
        icon={<Shirt className="h-6 w-6 text-cyan-700" />}
        onAdd={openCreate}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP classes (current page)..."
            value={search}
            onChange={setSearch}
            resultCount={filtered.length}
            totalCount={rmpClassesPage?.totalCount ?? rows.length}
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={4} className="mt-6" />
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No RMP classes on this page</p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>
                      {r.rmp_color ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: r.rmp_color.code }}
                          />
                          <span>{r.rmp_color.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
                          if (confirm('Delete this RMP class?')) deleteMut.mutate(r.id);
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
            result={rmpClassesPage ?? null}
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
            <DialogTitle>{editing ? 'Edit RMP Class' : 'Add RMP Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter class name" />
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
              <Label>Color</Label>
              <Select value={rmpColorId} onValueChange={setRmpColorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {rmpColors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: color.code }}
                        />
                        {color.name}
                      </div>
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

export default RmpClassesPage;

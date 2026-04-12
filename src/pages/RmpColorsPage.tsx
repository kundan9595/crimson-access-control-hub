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
import { useRmpColors, useCreateRmpColor, useUpdateRmpColor, useDeleteRmpColor } from '@/hooks/masters/useRmpColors';
import type { RmpColor } from '@/services/masters/rmpColorsService';
import { Palette, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpColors } from '@/services/masters/rmpColorsService';
import { config } from '@/config/environment';

const RmpColorsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpColorsPage, isLoading, isFetching } = useRmpColors(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpColorsPage?.data ?? [];
  const createMut = useCreateRmpColor();
  const updateMut = useUpdateRmpColor();
  const deleteMut = useDeleteRmpColor();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpColor | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleExport = async () => {
    const all = await fetchRmpColors();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-colors'),
      headers: ['Name', 'Code', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Code': 'code',
        'Status': 'status',
        'Created At': (item: RmpColor) => new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCode('#000000');
    setStatus('active');
    setOpen(true);
  };

  const openEdit = (r: RmpColor) => {
    setEditing(r);
    setName(r.name);
    setCode(r.code);
    setStatus(r.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  };

  const onSave = () => {
    if (!name.trim() || !code.trim()) return;
    const data = { 
      name: name.trim(), 
      code: code.trim(),
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
        title="RMP Colors"
        description="Define color variants with hex codes for RMP products"
        icon={<Palette className="h-6 w-6 text-purple-700" />}
        onAdd={openCreate}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP colors..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={rmpColorsPage?.totalCount ?? rows.length}
          />
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={4} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP colors match your search' : 'No RMP colors found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{r.code}</code>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: r.code }}
                        title={r.code}
                      />
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
                          if (confirm('Delete this RMP color?')) deleteMut.mutate(r.id);
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
            result={rmpColorsPage ?? null}
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
            <DialogTitle>{editing ? 'Edit RMP Color' : 'Add RMP Color'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter color name" />
            </div>
            <div className="space-y-2">
              <Label>Hex Code</Label>
              <div className="flex items-center gap-3">
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="#000000"
                  className="font-mono"
                />
                <div 
                  className="w-10 h-10 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: code }}
                />
              </div>
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
            <Button onClick={onSave} disabled={!name.trim() || !code.trim() || createMut.isPending || updateMut.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RmpColorsPage;

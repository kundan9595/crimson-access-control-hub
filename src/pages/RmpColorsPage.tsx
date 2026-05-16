import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useRmpColors, useCreateRmpColor, useUpdateRmpColor, useDeleteRmpColor } from '@/hooks/masters/useRmpColors';
import type { RmpColor } from '@/services/masters/rmpColorsService';
import { Palette, Edit, Trash2 } from 'lucide-react';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  rmpColorsColumns,
  rmpColorsGetRowId,
  rmpColorsCreateEmptyRow,
  rmpColorsToCreatePayload,
  rmpColorsToUpdatePayload,
  rmpColorsQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpColorsConfig';
import { createRmpColor, updateRmpColor, fetchRmpColors, fetchRmpColorsPaginated } from '@/services/masters/rmpColorsService';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
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
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpColor | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = rmpColorsPage?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        fetchRmpColorsPaginated(pp, search ? { search } : undefined),
      ),
    [search],
  );

  const handleExport = async () => {
    const all = await fetchRmpColors();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-colors'),
      headers: ['Name', 'Code', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Code': 'code',
        'Status': 'status',
        'Created At': (item: RmpColor) => item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        'Updated At': (item: RmpColor) => item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-',
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
        onBulkEdit={() => openBulkEditTab('/masters/rmp-colors/bulk-edit')}
        onImport={() => setImportOpen(true)}
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
            totalCount={listTotal}
          />
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP colors"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_colors', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_colors'] });
              }}
            />
          )}
          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={7} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP colors match your search' : 'No RMP colors found'}
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
                  <TableHead>Code</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
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

      <BulkImportFromConfigDialog<RmpColor, ReturnType<typeof rmpColorsToCreatePayload>, ReturnType<typeof rmpColorsToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Colors"
        filenameStem="rmp-colors"
        columns={rmpColorsColumns}
        createEmptyRow={rmpColorsCreateEmptyRow}
        toCreatePayload={rmpColorsToCreatePayload}
        toUpdatePayload={rmpColorsToUpdatePayload}
        queryKey={rmpColorsQueryKey}
        createMutation={async (payload) => {
          await createRmpColor(payload);
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpColor(id, updates);
        }}
        fetchAll={fetchRmpColors}
        getRowId={rmpColorsGetRowId}
        defaultKeyFields={['name']}
      />
    </div>
  );
};

export default RmpColorsPage;

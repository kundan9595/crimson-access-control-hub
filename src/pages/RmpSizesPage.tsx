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
import { useRmpSizes, useAllRmpSizes, useCreateRmpSize, useUpdateRmpSize, useDeleteRmpSize } from '@/hooks/masters/useRmpSizes';
import type { RmpSize, RmpSizeType } from '@/services/masters/rmpSizesService';
import { Ruler, Edit, Trash2 } from 'lucide-react';
import { openBulkEditTab, BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  rmpSizesColumns,
  rmpSizesGetRowId,
  rmpSizesCreateEmptyRow,
  rmpSizesToCreatePayload,
  rmpSizesToUpdatePayload,
  rmpSizesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpSizesConfig';
import { createRmpSize, updateRmpSize, fetchRmpSizes, fetchRmpSizesPaginated } from '@/services/masters/rmpSizesService';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { DateCell } from '@/components/masters/shared/DateCell';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { AdvancedFilterPanel } from '@/components/masters/advanced-filter/AdvancedFilterPanel';
import { buildFilterColumns } from '@/components/masters/advanced-filter/types';
import { useAdvancedFilter } from '@/hooks/masters/useAdvancedFilter';
import { QuickFilterBar } from '@/components/masters/advanced-filter/QuickFilterBar';
import { useQuickFilters } from '@/hooks/masters/useQuickFilters';

const RmpSizesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { filterGroup, setFilterGroup, isActive: filterActive, applyFilter, clearFilters } = useAdvancedFilter();
  const { values: quickValues, setEnumFilter, setDateRange, clearFilter: clearQuickFilter, clearAll: clearAllQuick, isActive: quickFilterActive, applyQuickFilters } = useQuickFilters();
  const isAnyFilterActive = filterActive || quickFilterActive;
  const filterColumns = useMemo(() => buildFilterColumns(rmpSizesColumns), []);

  const { data: rmpSizesPage, isLoading, isFetching } = useRmpSizes(
    page, pageSize,
    isAnyFilterActive ? undefined : (search ? { search } : undefined)
  );
  const { data: allRmpSizes = [], isLoading: isLoadingAll } = useAllRmpSizes({ enabled: isAnyFilterActive });

  const filteredRows = useMemo(
    () => (isAnyFilterActive ? applyQuickFilters(applyFilter(allRmpSizes, filterColumns), filterColumns) : []),
    [isAnyFilterActive, allRmpSizes, applyFilter, applyQuickFilters, filterColumns],
  );
  const rows = useMemo(() => {
    if (isAnyFilterActive) return filteredRows.slice((page - 1) * pageSize, page * pageSize);
    return rmpSizesPage?.data ?? [];
  }, [isAnyFilterActive, filteredRows, rmpSizesPage, page, pageSize]);
  const clientPaginationResult = useMemo(() => {
    if (!isAnyFilterActive) return null;
    return { page, pageSize, totalCount: filteredRows.length, totalPages: Math.max(1, Math.ceil(filteredRows.length / pageSize)), totalCountIsExact: true as const, data: rows };
  }, [isAnyFilterActive, filteredRows, rows, page, pageSize]);

  const createMut = useCreateRmpSize();
  const updateMut = useUpdateRmpSize();
  const deleteMut = useDeleteRmpSize();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpSize | null>(null);
  const [name, setName] = useState('');
  const [sizeType, setSizeType] = useState<RmpSizeType>('alpha');
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { setPage(1); }, [search, isAnyFilterActive]);
  useEffect(() => { bulk.clearSelection(); }, [search, isAnyFilterActive, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = isAnyFilterActive ? filteredRows.length : (rmpSizesPage?.totalCount ?? rows.length);

  const fetchAllMatchingIds = useCallback(
    () => isAnyFilterActive
      ? Promise.resolve(filteredRows.map((r) => r.id))
      : fetchAllRecordIds((pp) => fetchRmpSizesPaginated(pp, search ? { search } : undefined)),
    [isAnyFilterActive, filteredRows, search],
  );

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
        onBulkEdit={() => openBulkEditTab('/masters/rmp-sizes/bulk-edit')}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchFilter
              placeholder="Search RMP sizes..."
              value={search}
              onChange={setSearch}
              resultCount={rows.length}
              totalCount={listTotal}
            />
            <AdvancedFilterPanel columns={filterColumns} filterGroup={filterGroup} onChange={setFilterGroup} onClear={clearFilters} />
            <QuickFilterBar columns={filterColumns} values={quickValues} onEnumChange={setEnumFilter} onDateChange={setDateRange} onClearField={clearQuickFilter} onClearAll={clearAllQuick} />
            {isAnyFilterActive && <span className="text-xs text-muted-foreground">{filteredRows.length} filtered result{filteredRows.length !== 1 ? 's' : ''}</span>}
          </div>
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP sizes"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_sizes', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_sizes'] });
              }}
            />
          )}
              {isLoading || isLoadingAll ? (
            <MasterTableSkeleton showToolbar={false} columnCount={8} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {isAnyFilterActive ? 'No sizes match your filters' : search ? 'No RMP sizes match your search' : 'No RMP sizes found'}
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
                    <TableCell className="w-10 p-2 align-middle">
                      <Checkbox
                        checked={bulk.selectedIds.has(r.id)}
                        onCheckedChange={() => bulk.toggleRow(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </TableCell>
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
            result={isAnyFilterActive ? clientPaginationResult : (rmpSizesPage ?? null)}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            disabled={isLoading || isFetching || isLoadingAll}
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

      <BulkImportFromConfigDialog<RmpSize, ReturnType<typeof rmpSizesToCreatePayload>, ReturnType<typeof rmpSizesToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Sizes"
        filenameStem="rmp-sizes"
        columns={rmpSizesColumns}
        createEmptyRow={rmpSizesCreateEmptyRow}
        toCreatePayload={rmpSizesToCreatePayload}
        toUpdatePayload={rmpSizesToUpdatePayload}
        queryKey={rmpSizesQueryKey}
        createMutation={async (payload) => {
          await createRmpSize({
            name: payload.name,
            position: payload.position,
            size_type: payload.size_type,
            status: payload.status,
            is_deleted: payload.is_deleted,
            image: '',
          });
        }}
        updateMutation={async ({ id, updates }) => {
          await updateRmpSize(id, updates);
        }}
        fetchAll={fetchRmpSizes}
        getRowId={rmpSizesGetRowId}
      />

    </div>
  );
};

export default RmpSizesPage;

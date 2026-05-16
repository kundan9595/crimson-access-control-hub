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
import { useRmpClasses, useCreateRmpClass, useUpdateRmpClass, useDeleteRmpClass } from '@/hooks/masters/useRmpClasses';
import { useAllRmpColors } from '@/hooks/masters/useRmpColors';
import { useAllRmpSkus } from '@/hooks/masters/useRmpSkus';
import type { RmpClass } from '@/services/masters/rmpClassesService';
import type { RmpSku } from '@/services/masters/rmpSkusService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Shirt, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpColors } from '@/services/masters/rmpColorsService';
import { fetchRmpSkus } from '@/services/masters/rmpSkusService';
import { getEffectiveScottApiBaseUrl } from '@/config/scottApiRuntime';
import { config } from '@/config/environment';
import { ImageCell } from '@/components/masters/shared/ImageCell';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';
import { BulkImportFromConfigDialog } from '@/components/masters/bulk-edit';
import {
  buildRmpClassesColumns,
  rmpClassesGetRowId,
  rmpClassesCreateEmptyRow,
  rmpClassesToCreatePayload,
  rmpClassesToUpdatePayload,
  rmpClassesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpClassesConfig';
import {
  createRmpClass,
  fetchRmpClasses,
  fetchRmpClassesForBulkImport,
  fetchRmpClassesPaginated,
  updateRmpClass,
} from '@/services/masters/rmpClassesService';

/** Radix Select reserves empty string; use a sentinel for optional "None" rows. */
const SELECT_NONE = '__none__';

// Helper to ensure image URL is absolute (then HTTPS-safe on Vercel via proxy)
const resolveImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  let resolved: string | undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    resolved = url;
  } else if (url.startsWith('/')) {
    resolved = `${getEffectiveScottApiBaseUrl()}${url}`;
  } else {
    resolved = url;
  }
  return proxifyScottImageUrl(resolved);
};

// Gallery component to display all images with preview
const ImageGallery: React.FC<{
  row: RmpClass;
}> = ({ row }) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);


  // Build array of all available images with their thumbnails
  const images = [
    { full: resolveImageUrl(row.image_1), thumb: resolveImageUrl(row.image_1_thumb) },
    { full: resolveImageUrl(row.image_2), thumb: resolveImageUrl(row.image_2_thumb) },
    { full: resolveImageUrl(row.image_3), thumb: resolveImageUrl(row.image_3_thumb) },
    { full: resolveImageUrl(row.image_4), thumb: resolveImageUrl(row.image_4_thumb) },
    { full: resolveImageUrl(row.image_5), thumb: resolveImageUrl(row.image_5_thumb) },
  ].filter((img) => img.full || img.thumb);

  if (images.length === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm" title="No images available">
        <ImageIcon className="w-4 h-4" />
        <span>-</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img.thumb || img.full}
            alt={`${row.name} - image ${idx + 1}`}
            className="w-10 h-10 object-cover rounded-md border cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => setPreviewIndex(idx)}
          />
        ))}
      </div>

      {/* Full-size preview dialog */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => !open && setPreviewIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative flex items-center justify-center min-h-[300px]">
            {previewIndex !== null && images[previewIndex] && (
              <img
                src={images[previewIndex].full || images[previewIndex].thumb}
                alt={`${row.name} - full preview`}
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-full">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setPreviewIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))}
              >
                ←
              </Button>
              <span className="text-white text-sm">
                {previewIndex !== null ? previewIndex + 1 : 0} / {images.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setPreviewIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))}
              >
                →
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const RmpClassesPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [search, setSearch] = useState('');

  const { data: rmpClassesPage, isLoading, isFetching } = useRmpClasses(
    page,
    pageSize,
    search ? { search } : undefined
  );
  const rows = rmpClassesPage?.data ?? [];
  const createMut = useCreateRmpClass();
  const updateMut = useUpdateRmpClass();
  const deleteMut = useDeleteRmpClass();
  const { data: rmpColors = [] } = useAllRmpColors();
  const { data: allRmpSkus = [], isLoading: skusLoading } = useAllRmpSkus();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  const colorById = useMemo(
    () => new Map(rmpColors.map((c) => [c.id, c] as const)),
    [rmpColors],
  );

  /** SKUs declare `rmp_class_id` → inverse of class → SKUs for display on this page. */
  const skusByClassId = useMemo(() => {
    const m = new Map<string, RmpSku[]>();
    for (const sku of allRmpSkus) {
      const cid = sku.rmp_class_id;
      if (!cid) continue;
      const list = m.get(cid) ?? [];
      list.push(sku);
      m.set(cid, list);
    }
    return m;
  }, [allRmpSkus]);

  const resolveDisplayColor = (row: RmpClass) =>
    row.rmp_color ?? (row.rmp_color_id ? colorById.get(row.rmp_color_id) : undefined);

  const linkedSkusForClass = (classId: string) => skusByClassId.get(classId) ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RmpClass | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState(0);
  const [rmpColorId, setRmpColorId] = useState('');
  const [status, setStatus] = useState('active');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    bulk.clearSelection();
  }, [search, bulk.clearSelection]);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const listTotal = rmpClassesPage?.totalCount ?? rows.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        fetchRmpClassesPaginated(pp, search ? { search } : undefined),
      ),
    [search],
  );

  const importColumns = useMemo(() => {
    const rmpColorOptions = rmpColors.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` }));
    return buildRmpClassesColumns({
      rmpColorOptions,
    });
  }, [rmpColors]);

  const handleExport = async () => {
    const [all, colors, skus] = await Promise.all([
      fetchRmpClasses(),
      fetchRmpColors(),
      fetchRmpSkus(),
    ]);
    if (!all.length) return;

    const exportColorById = new Map(colors.map((c) => [c.id, c] as const));
    const colorLabel = (item: RmpClass) => {
      const c =
        item.rmp_color ?? (item.rmp_color_id ? exportColorById.get(item.rmp_color_id) : undefined);
      return c ? c.name : item.rmp_color_id ?? '-';
    };

    const skusByClassExport = new Map<string, RmpSku[]>();
    for (const sku of skus) {
      const cid = sku.rmp_class_id;
      if (!cid) continue;
      const list = skusByClassExport.get(cid) ?? [];
      list.push(sku);
      skusByClassExport.set(cid, list);
    }
    const skuNamesForClass = (item: RmpClass) => {
      const list = skusByClassExport.get(item.id) ?? [];
      if (!list.length) return '-';
      return list.map((s) => s.name).join('; ');
    };

    exportToCSV({
      filename: generateExportFilename('rmp-classes'),
      headers: ['Name', 'Position', 'Color', 'Linked SKUs', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Position': 'position',
        'Color': colorLabel,
        'Linked SKUs': skuNamesForClass,
        'Status': 'status',
        'Created At': (item: RmpClass) => new Date(item.created_at).toLocaleDateString(),
        'Updated At': (item: RmpClass) => new Date(item.updated_at).toLocaleDateString(),
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
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        canExport={rows.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP classes..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={listTotal}
          />
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="RMP classes"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteMut.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('rmp_classes', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['rmp_classes'] });
              }}
            />
          )}
              {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={10} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP classes match your search' : 'No RMP classes found'}
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
                  <TableHead>Images</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Linked SKUs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const displayColor = resolveDisplayColor(r);
                  const linkedSkus = linkedSkusForClass(r.id);
                  const skuPreview =
                    linkedSkus.length === 0
                      ? null
                      : linkedSkus.length <= 2
                        ? linkedSkus.map((s) => s.name).join(', ')
                        : `${linkedSkus
                            .slice(0, 2)
                            .map((s) => s.name)
                            .join(', ')} +${linkedSkus.length - 2}`;
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
                      <ImageGallery row={r} />
                    </TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell>
                      {displayColor ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: displayColor.code }}
                          />
                          <span>{displayColor.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      {linkedSkus.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-default truncate block text-sm">{skuPreview}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="font-medium text-xs mb-1.5">SKUs using this class</p>
                            <ul className="text-xs space-y-0.5 text-left max-h-48 overflow-y-auto">
                              {linkedSkus.map((s) => (
                                <li key={s.id}>{s.name}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'active' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString()}
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
                  );
                })}
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
        <DialogContent aria-describedby={undefined}>
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
              <Select
                value={rmpColorId || SELECT_NONE}
                onValueChange={(v) => setRmpColorId(v === SELECT_NONE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a color (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>None</SelectItem>
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

      <BulkImportFromConfigDialog<RmpClass, ReturnType<typeof rmpClassesToCreatePayload>, ReturnType<typeof rmpClassesToUpdatePayload>>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="RMP Classes"
        filenameStem="rmp-classes"
        columns={importColumns}
        createEmptyRow={rmpClassesCreateEmptyRow}
        toCreatePayload={rmpClassesToCreatePayload}
        toUpdatePayload={rmpClassesToUpdatePayload}
        queryKey={rmpClassesQueryKey}
        createMutation={async (payload) =>
          createRmpClass({
            name: payload.name,
            position: payload.position,
            status: payload.status,
            is_deleted: payload.is_deleted,
            rmp_color_id: payload.rmp_color_id,
          })
        }
        updateMutation={async ({ id, updates }) => updateRmpClass(id, updates)}
        fetchAll={fetchRmpClassesForBulkImport}
        getRowId={rmpClassesGetRowId}
        defaultKeyFields={['name']}
      />
    </div>
  );
};

export default RmpClassesPage;

import React, { useState, useEffect, useMemo } from 'react';
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
import { useAllRmpSkus } from '@/hooks/masters/useRmpSkus';
import type { RmpClass } from '@/services/masters/rmpClassesService';
import type { RmpSku } from '@/services/masters/rmpSkusService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Shirt, Edit, Trash2 } from 'lucide-react';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { fetchRmpClasses } from '@/services/masters/rmpClassesService';
import { fetchRmpColors } from '@/services/masters/rmpColorsService';
import { fetchRmpSkus } from '@/services/masters/rmpSkusService';
import { config } from '@/config/environment';

/** Radix Select reserves empty string; use a sentinel for optional "None" rows. */
const SELECT_NONE = '__none__';

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
  const { data: allRmpSkus = [] } = useAllRmpSkus();

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

  useEffect(() => {
    setPage(1);
  }, [search]);

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
      headers: ['Name', 'Position', 'Color', 'Linked SKUs', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Position': 'position',
        'Color': colorLabel,
        'Linked SKUs': skuNamesForClass,
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
            placeholder="Search RMP classes..."
            value={search}
            onChange={setSearch}
            resultCount={rows.length}
            totalCount={rmpClassesPage?.totalCount ?? rows.length}
          />
              {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={7} className="mt-6" />
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {search ? 'No RMP classes match your search' : 'No RMP classes found'}
            </p>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Primary Image</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Linked SKUs</TableHead>
                  <TableHead>Status</TableHead>
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
                  const additionalImages = [r.image_2, r.image_3, r.image_4, r.image_5].filter(Boolean).length;
                  return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      {r.image_1 || r.image_1_thumbnail ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={r.image_1_thumbnail || r.image_1}
                            alt={r.name}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                          {additionalImages > 0 && (
                            <Badge variant="outline" className="text-xs">+{additionalImages}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
    </div>
  );
};

export default RmpClassesPage;

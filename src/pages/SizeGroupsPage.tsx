import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Ruler, Plus } from 'lucide-react';
import { useSizes, useCreateSize, useUpdateSize, useDeleteSize } from '@/hooks/masters/useSizes';
import { useAllSizeTypes } from '@/hooks/masters/useSizeTypes';
import { Size } from '@/services/masters/types';
import { useSearchParams } from 'react-router-dom';
import SizeDialog from '@/components/masters/SizeDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchSizes } from '@/services/masters/sizesServiceScott';
import { config } from '@/config/environment';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SizeGroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);

  const { data: sizesPage, isLoading } = useSizes(page, pageSize);
  const sizes = sizesPage?.data;
  const { data: sizeTypes } = useAllSizeTypes();
  const createSize = useCreateSize();
  const updateSize = useUpdateSize();
  const deleteSize = useDeleteSize();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const sizeTypesMap = useMemo(() => {
    const map = new Map<string, string>();
    sizeTypes?.forEach((st) => map.set(st.id, st.name));
    return map;
  }, [sizeTypes]);

  const filteredSizes = useMemo(() => {
    if (!searchTerm) return sizes;
    return sizes?.filter(
      (size) =>
        size.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        size.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sizes, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleEdit = (size: Size) => {
    setEditingSize(size);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this size?')) {
      deleteSize.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSize(null);
    if (searchParams.get('add') === 'true') {
      setSearchParams({});
    }
  };

  const handleExport = async () => {
    const all = await fetchSizes();
    const rows =
      searchTerm.trim() === ''
        ? all
        : all.filter(
            (size) =>
              size.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              size.code?.toLowerCase().includes(searchTerm.toLowerCase()),
          );
    if (!rows.length) return;

    const csvContent = [
      ['Name', 'Code', 'Size Type', 'Status', 'Sort Order'].join(','),
      ...rows.map((size) => [
        `"${size.name}"`,
        `"${size.code || ''}"`,
        `"${sizeTypesMap.get(size.size_group_id) || 'N/A'}"`,
        size.status,
        size.sort_order ?? '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sizes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Export completed');
  };

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        withCard={false}
        showToolbar={false}
        columnCount={6}
        header={
          <MasterPageHeader
            title="Sizes"
            description="Manage product sizes"
            icon={<Ruler className="h-8 w-8" />}
            onAdd={() => setIsDialogOpen(true)}
            onExport={handleExport}
            onImport={() => setIsBulkImportOpen(true)}
            canExport={!!sizesPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Sizes"
        description="Manage product sizes"
        icon={<Ruler className="h-8 w-8" />}
        onAdd={() => setIsDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setIsBulkImportOpen(true)}
        canExport={!!sizesPage?.data.length}
        isScottApi={true}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Search Sizes</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sizes (current page)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Size Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSizes?.map((size) => (
                <TableRow key={size.id}>
                  <TableCell className="font-medium">{size.name}</TableCell>
                  <TableCell>{size.code || '-'}</TableCell>
                  <TableCell>
                    {sizeTypesMap.get(size.size_group_id) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={size.status === 'active' ? 'default' : 'secondary'}>
                      {size.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{size.sort_order ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(size)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(size.id)}
                        disabled={deleteSize.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredSizes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Sizes Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm
                          ? 'No sizes match your search criteria.'
                          : 'Get started by creating your first size.'}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => setIsDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Size
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {sizesPage && sizesPage.data.length > 0 && (
          <MasterServerPagination
            className="mt-4"
            result={sizesPage}
            disabled={isLoading}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>

      <SizeDialog
        size={editingSize}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="sizes"
        templateHeaders={['Name', 'Code', 'Size Type ID', 'Status', 'Sort Order']}
        sampleData={[
          ['Small', 'S', '1', 'active', '1'],
          ['Medium', 'M', '1', 'active', '2'],
          ['Large', 'L', '1', 'active', '3'],
        ]}
      />
    </div>
  );
};

export default SizeGroupsPage;

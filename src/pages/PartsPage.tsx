import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Wrench } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { PartDialog } from '@/components/masters/PartDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useParts, useCreatePart, useUpdatePart, useDeletePart } from '@/hooks/masters/useParts';
import type { Part } from '@/hooks/masters/useParts';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchParts } from '@/services/masters/partsServiceScott';
import { config } from '@/config/environment';

const PartsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | undefined>();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);

  const { data: partsPage, isLoading } = useParts(page, pageSize);
  const parts = partsPage?.data ?? [];
  const createPartMutation = useCreatePart();
  const updatePartMutation = useUpdatePart();
  const deletePartMutation = useDeletePart();

  const filteredParts = parts.filter((part) =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Sort parts by sort_position, then by name
  const sortedParts = [...filteredParts].sort((a, b) => {
    const positionA = a.sort_position || 0;
    const positionB = b.sort_position || 0;
    if (positionA !== positionB) return positionA - positionB;
    return a.name.localeCompare(b.name);
  });

  const handleAdd = () => {
    setEditingPart(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setDialogOpen(true);
  };

  const handleDelete = async (part: Part) => {
    if (window.confirm(`Are you sure you want to delete "${part.name}"?`)) {
      try {
        await deletePartMutation.mutateAsync(part.id);
      } catch (error) {
        console.error('Error deleting part:', error);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingPart) {
        await updatePartMutation.mutateAsync({
          id: editingPart.id,
          updates: data,
        });
      } else {
        await createPartMutation.mutateAsync(data);
      }
      setDialogOpen(false);
      setEditingPart(undefined);
    } catch (error) {
      console.error('Error submitting part:', error);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPart(undefined);
  };

  const handleExport = async () => {
    const all = await fetchParts();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('parts'),
      headers: ['Name', 'Order Criteria', 'Sort Position', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'Order Criteria': (item: Part) => item.order_criteria ? 'Yes' : 'No',
        'Sort Position': (item: Part) => (item.sort_position || 0).toString(),
        'Status': 'status',
        'Created At': (item: Part) => new Date(item.created_at).toLocaleDateString()
      }
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Name', 'Order Criteria', 'Sort Position', 'Status'];
  const sampleData = [
    ['Collar', 'true', '1', 'active'],
    ['Sleeves', 'false', '2', 'active']
  ];

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={5}
        header={
          <MasterPageHeader
            title="Parts"
            description="Define and manage product parts and components"
            icon={<Wrench className="h-6 w-6 text-slate-600" />}
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            canExport={!!partsPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Parts"
        description="Define and manage product parts and components"
        icon={<Wrench className="h-6 w-6 text-slate-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={parts.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search parts (current page)..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedParts.length}
            totalCount={
              partsPage?.totalCountIsExact ? partsPage.totalCount : parts.length
            }
          />
          
          <div className="mt-6">
            {sortedParts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Order Criteria</TableHead>
                    <TableHead className="w-20">Sort Position</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell className="text-center">
                        {part.order_criteria ? (
                          <Badge variant="default" className="text-xs">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{part.sort_position || 0}</TableCell>
                      <TableCell>
                        <Badge variant={part.status === 'active' ? 'default' : 'secondary'}>
                          {part.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(part.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(part)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(part)}
                            disabled={deletePartMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <p>No parts found matching "{searchTerm}"</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </>
                ) : (
                  <>
                    <p>No parts found</p>
                    <p className="text-sm">Click "Add Part" to create your first part entry</p>
                  </>
                )}
              </div>
            )}
          </div>

          {partsPage && partsPage.data.length > 0 && (
            <MasterServerPagination
              className="mt-6"
              result={partsPage}
              disabled={isLoading}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      <PartDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        part={editingPart}
        onSubmit={handleSubmit}
        isSubmitting={createPartMutation.isPending || updatePartMutation.isPending}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="parts"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default PartsPage;

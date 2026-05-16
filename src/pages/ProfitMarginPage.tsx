
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { ProfitMarginDialog } from '@/components/masters/ProfitMarginDialog';
import { useProfitMargins, useDeleteProfitMargin, type ProfitMarginFilter } from '@/hooks/masters/useProfitMargins';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';
import { profitMarginsService } from '@/services/masters/profitMarginsService';
import { openBulkEditTab } from '@/components/masters/bulk-edit';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterListBulkBar } from '@/components/masters/shared/MasterListBulkBar';
import { useMasterListBulkSelection } from '@/hooks/masters/useMasterListBulkSelection';
import { fetchAllRecordIds } from '@/services/scott/scottPagination';
import { callScottBulkDelete } from '@/services/scott/callScottDashboard';
import { config } from '@/config/environment';

const ProfitMarginPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const filters: ProfitMarginFilter | undefined = searchTerm ? { search: searchTerm } : undefined;
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProfitMargin, setSelectedProfitMargin] = useState<ProfitMargin | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: marginsPage, isLoading, isFetching } = useProfitMargins(page, pageSize, filters);
  const profitMargins = marginsPage?.data ?? [];
  const deleteProfitMarginMutation = useDeleteProfitMargin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulk = useMasterListBulkSelection();

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    bulk.clearSelection();
  }, [searchTerm, bulk.clearSelection]);

  const pageRowIds = useMemo(() => profitMargins.map((p) => p.id), [profitMargins]);
  const listTotal = marginsPage?.totalCountIsExact ? marginsPage.totalCount : profitMargins.length;

  const fetchAllMatchingIds = useCallback(
    () =>
      fetchAllRecordIds((pp) =>
        profitMarginsService.getPage(pp, searchTerm ? { search: searchTerm } : undefined),
      ),
    [searchTerm],
  );

  const handleAdd = () => {
    setSelectedProfitMargin(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (profitMargin: ProfitMargin) => {
    setSelectedProfitMargin(profitMargin);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this profit margin?')) {
      try {
        await deleteProfitMarginMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting profit margin:', error);
      }
    }
  };

  const handleExport = async () => {
    const allMargins = await profitMarginsService.getAll();
    if (allMargins.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no profit margins to export.",
        variant: "destructive",
      });
      return;
    }

    const exportConfig = {
      filename: generateExportFilename('profit-margins'),
      headers: [
        'Name',
        'Min Range',
        'Max Range',
        'Margin Percentage',
        'Branding Print',
        'Branding Embroidery',
        'Status',
        'Created At'
      ],
      data: allMargins,
      fieldMap: {
        'Name': 'name',
        'Min Range': 'min_range',
        'Max Range': 'max_range',
        'Margin Percentage': (item: any) => `${item.margin_percentage}%`,
        'Branding Print': (item: any) => `${item.branding_print}`,
        'Branding Embroidery': (item: any) => `${item.branding_embroidery}`,
        'Status': 'status',
        'Created At': (item: any) => new Date(item.created_at).toLocaleDateString()
      }
    };

    exportToCSV(exportConfig);
    toast({
      title: "Export successful",
      description: `${allMargins.length} profit margins exported successfully.`,
    });
  };

  const handleImport = () => {
    setShowImportDialog(true);
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);
  const formatRange = (min: number, max: number) => `${min} - ${max}`;

  const importTemplateHeaders = [
    'name',
    'min_range',
    'max_range',
    'margin_percentage',
    'branding_print',
    'branding_embroidery',
    'status'
  ];

  const importSampleData = [
    ['Standard Margin', '0', '1000', '10.00', '5.00', '8.00', 'active'],
    ['Premium Margin', '1001', '5000', '15.00', '7.50', '10.00', 'active'],
    ['Bulk Margin', '5001', '10000', '8.00', '3.00', '5.00', 'active']
  ];

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={10}
        header={
      <MasterPageHeader
        title="Profit Margins"
        description="Configure profit margins and pricing strategies"
        icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
        onAdd={handleAdd}
        onBulkEdit={() => openBulkEditTab('/masters/profit-margin/bulk-edit')}
        onExport={handleExport}
        onImport={handleImport}
        canExport={!!marginsPage?.data.length}
        isScottApi={true}
      />
    }
  />
);
}

return (
<div className="space-y-6">
  <MasterPageHeader
    title="Profit Margins"
    description="Configure profit margins and pricing strategies"
    icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
    onAdd={handleAdd}
    onBulkEdit={() => openBulkEditTab('/masters/profit-margin/bulk-edit')}
    onExport={handleExport}
    onImport={handleImport}
    canExport={profitMargins.length > 0}
    isScottApi={true}
  />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search profit margins..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={profitMargins.length}
            totalCount={
              marginsPage?.totalCountIsExact ? marginsPage.totalCount : profitMargins.length
            }
          />
          {listTotal > 0 && (
            <MasterListBulkBar
              entityPlural="profit margins"
              totalCount={listTotal}
              pageRowIds={pageRowIds}
              selection={bulk}
              fetchAllMatchingIds={fetchAllMatchingIds}
              deleteOne={(id) => deleteProfitMarginMutation.mutateAsync(id)}
              bulkDeleteAll={(ids) => callScottBulkDelete('profit_margins', ids)}
              disabled={isLoading || isFetching}
              onAfterBulk={() => {
                void queryClient.invalidateQueries({ queryKey: ['profitMargins'] });
              }}
            />
          )}
          
          <div className="mt-6">
            {profitMargins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 p-2">
                      <Checkbox
                        checked={bulk.pageHeaderChecked(pageRowIds)}
                        onCheckedChange={() => bulk.togglePageHeader(pageRowIds)}
                        disabled={profitMargins.length === 0}
                        aria-label="Select all rows on this page"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Print</TableHead>
                    <TableHead>Embroidery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitMargins.map((profitMargin) => (
                    <TableRow key={profitMargin.id}>
                      <TableCell className="w-10 p-2 align-middle">
                        <Checkbox
                          checked={bulk.selectedIds.has(profitMargin.id)}
                          onCheckedChange={() => bulk.toggleRow(profitMargin.id)}
                          aria-label={`Select ${profitMargin.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{profitMargin.name}</TableCell>
                      <TableCell>{formatRange(profitMargin.min_range, profitMargin.max_range)}</TableCell>
                      <TableCell>{formatPercentage(profitMargin.margin_percentage)}</TableCell>
                      <TableCell>{formatNumber(profitMargin.branding_print)}</TableCell>
                      <TableCell>{formatNumber(profitMargin.branding_embroidery)}</TableCell>
                      <TableCell>
                        <Badge variant={profitMargin.status === 'active' ? 'default' : 'secondary'}>
                          {profitMargin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(profitMargin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(profitMargin.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(profitMargin)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(profitMargin.id)}
                            disabled={deleteProfitMarginMutation.isPending}
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
                <p>No profit margins found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
          <MasterServerPagination
            result={marginsPage ?? null}
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

      <ProfitMarginDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        profitMargin={selectedProfitMargin}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        type="profitMargins"
        templateHeaders={importTemplateHeaders}
        sampleData={importSampleData}
      />

    </div>
  );
};

export default ProfitMarginPage;

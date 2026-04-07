
import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { FabricDialog } from '@/components/masters/FabricDialog';
import { FabricsList } from '@/components/masters/FabricsList';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useFabrics } from '@/hooks/masters/useFabrics';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchFabrics } from '@/services/masters/fabricsServiceScott';
import { config } from '@/config/environment';

const FabricPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const { data: fabricsPage, isLoading } = useFabrics(page, pageSize);
  const fabrics = fabricsPage?.data ?? [];

  const handleAdd = () => {
    setDialogOpen(true);
  };

  const handleExport = async () => {
    const all = await fetchFabrics();
    if (!all.length) return;

    const csvContent = [
      ['Name', 'Fabric Type', 'GSM', 'UOM', 'Price', 'Colors (comma-separated)', 'Status', 'Created At'].join(','),
      ...all.map((fabric) => [
        `"${fabric.name}"`,
        fabric.fabric_type,
        fabric.gsm,
        fabric.uom,
        fabric.price,
        fabric.colors && fabric.colors.length > 0
          ? `"${fabric.colors.map((c) => c.name).join(', ')}"`
          : '',
        fabric.status,
        new Date(fabric.created_at).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabrics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setBulkImportOpen(true);
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredFabrics = fabrics.filter(
    (fabric) =>
      fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.fabric_type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Fabrics"
        description="Manage fabric types, properties, and specifications"
        icon={<Scissors className="h-6 w-6 text-amber-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={fabrics.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search fabric (current page)..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredFabrics.length}
            totalCount={
              fabricsPage?.totalCountIsExact ? fabricsPage.totalCount : fabrics.length
            }
          />

          <div className="mt-6">
            <FabricsList searchTerm={searchTerm} fabrics={fabrics} isLoading={isLoading} />
          </div>

          {fabricsPage && fabricsPage.data.length > 0 && (
            <MasterServerPagination
              className="mt-6"
              result={fabricsPage}
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

      <FabricDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <BulkImportDialog open={bulkImportOpen} onOpenChange={setBulkImportOpen} type="fabrics" />
    </div>
  );
};

export default FabricPage;

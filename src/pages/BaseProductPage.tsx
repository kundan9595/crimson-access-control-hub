
import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { BaseProductsTable } from '@/components/masters/BaseProductsTable';
import { BaseProductDialog } from '@/components/masters/BaseProductDialog';
import { useBaseProducts } from '@/hooks/masters/useBaseProducts';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { config } from '@/config/environment';

const BaseProductPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: baseProductPage, isLoading, isFetching } = useBaseProducts(page, pageSize);
  const baseProducts = baseProductPage?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredBaseProducts = baseProducts.filter(
    (baseProduct) =>
      baseProduct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (baseProduct.base_product_type?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (baseProduct.asset_info?.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const handleAdd = () => {
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    // Export base products clicked
  };

  const handleImport = () => {
    // Import base products clicked
  };

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={17}
        header={
          <MasterPageHeader
            title="Base Product"
            description="Manage base product templates and configurations"
            icon={<Box className="h-6 w-6 text-rose-600" />}
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            canExport={!!baseProductPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Base Product"
        description="Manage base product templates and configurations"
        icon={<Box className="h-6 w-6 text-rose-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={baseProducts.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search base products..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredBaseProducts.length}
            totalCount={
              baseProductPage?.totalCountIsExact
                ? baseProductPage.totalCount
                : baseProducts.length
            }
          />

          <div className="mt-6">
            <BaseProductsTable
              rows={filteredBaseProducts}
              isLoading={false}
              paginationDisabled={isFetching}
              paginated={baseProductPage ?? null}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <BaseProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default BaseProductPage;

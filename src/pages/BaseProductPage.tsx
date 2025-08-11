
import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { BaseProductsTable } from '@/components/masters/BaseProductsTable';
import { BaseProductDialog } from '@/components/masters/BaseProductDialog';
import { useBaseProducts } from '@/hooks/masters/useBaseProducts';

const BaseProductPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: baseProducts = [], isLoading } = useBaseProducts();

  // Filter base products based on search term
  const filteredBaseProducts = baseProducts.filter((baseProduct) =>
    baseProduct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    baseProduct.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    baseProduct.fabric?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search base products..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredBaseProducts.length}
            totalCount={baseProducts.length}
          />
          
          <div className="mt-6">
            <BaseProductsTable />
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

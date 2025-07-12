
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { BaseProductsList } from '@/components/masters/BaseProductsList';
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
    // TODO: Implement export functionality
    console.log('Export base products clicked');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import base products clicked');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            {!isLoading && searchTerm ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBaseProducts.map((baseProduct) => (
                  <Card key={baseProduct.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{baseProduct.name}</h3>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {baseProduct.category && (
                              <div>Category: {baseProduct.category.name}</div>
                            )}
                            {baseProduct.fabric && (
                              <div>Fabric: {baseProduct.fabric.name}</div>
                            )}
                            <div>Base Price: ₹{baseProduct.base_price.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <BaseProductsList />
            )}
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

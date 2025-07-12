
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const BaseProductPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    // TODO: Open base product dialog when implemented
    console.log('Add base product clicked');
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
        canExport={false}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search base products..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={0}
            totalCount={0}
          />
          
          <div className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No base products found</p>
              <p className="text-sm">Click "Add Base Product" to create your first base product template</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaseProductPage;


import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const FabricPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    // TODO: Open fabric dialog when implemented
    console.log('Add fabric clicked');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export fabric clicked');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import fabric clicked');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Fabric"
        description="Manage fabric types, properties, and specifications"
        icon={<Scissors className="h-6 w-6 text-amber-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={false}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search fabric..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={0}
            totalCount={0}
          />
          
          <div className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No fabric records found</p>
              <p className="text-sm">Click "Add Fabric" to create your first fabric entry</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FabricPage;

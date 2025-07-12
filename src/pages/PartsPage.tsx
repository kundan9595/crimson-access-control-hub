
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const PartsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    // TODO: Open parts dialog when implemented
    console.log('Add part clicked');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export parts clicked');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import parts clicked');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Parts"
        description="Define and manage product parts and components"
        icon={<Wrench className="h-6 w-6 text-slate-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={false}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search parts..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={0}
            totalCount={0}
          />
          
          <div className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No parts found</p>
              <p className="text-sm">Click "Add Part" to create your first part entry</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsPage;

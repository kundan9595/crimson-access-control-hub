
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const AddOnsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = () => {
    // TODO: Open add-ons dialog when implemented
    console.log('Add add-on clicked');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export add-ons clicked');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import add-ons clicked');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Add Ons"
        description="Configure additional features and add-on components"
        icon={<Plus className="h-6 w-6 text-lime-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={false}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search add-ons..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={0}
            totalCount={0}
          />
          
          <div className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No add-ons found</p>
              <p className="text-sm">Click "Add Add On" to create your first add-on entry</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddOnsPage;

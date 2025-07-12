
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { AddOnsList } from '@/components/masters/AddOnsList';
import { useAddOns, useBulkCreateAddOns } from '@/hooks/masters/useAddOns';

const AddOnsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: addOns = [] } = useAddOns();
  const bulkCreateMutation = useBulkCreateAddOns();

  const filteredAddOns = addOns.filter(addOn =>
    addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addOn.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    // This will be handled by the AddOnsList component
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
        canExport={addOns.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search add-ons..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredAddOns.length}
            totalCount={addOns.length}
          />
          
          <div className="mt-6">
            <AddOnsList searchTerm={searchTerm} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddOnsPage;

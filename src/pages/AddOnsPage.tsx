
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { AddOnsList } from '@/components/masters/AddOnsList';
import { useAddOns, useBulkCreateAddOns } from '@/hooks/masters/useAddOns';
import { useAuth } from '@/contexts/AuthContext';

const AddOnsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: addOns = [] } = useAddOns();
  const bulkCreateMutation = useBulkCreateAddOns();
  const addOnsListRef = useRef<{ triggerCreate: () => void }>(null);
  const { user, loading: authLoading } = useAuth();

  const filteredAddOns = addOns.filter(addOn =>
    addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addOn.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (!user) {
      return;
    }
    
    if (!addOnsListRef.current) {
      return;
    }
    
    addOnsListRef.current?.triggerCreate();
  };

  const handleExport = () => {
    if (!user) {
      return;
    }
    // TODO: Implement export functionality
  };

  const handleImport = () => {
    if (!user) {
      return;
    }
    // TODO: Implement import functionality
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Add Ons"
        description="Configure additional features and add-on components"
        icon={<Plus className="h-6 w-6 text-lime-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={addOns.length > 0 && !!user}
      />

      {!user && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p>Please sign in to access the Add Ons management system.</p>
              <p className="text-sm mt-2">You need to be authenticated to create, edit, or delete add-ons and their options.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {user && (
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
              <AddOnsList ref={addOnsListRef} searchTerm={searchTerm} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddOnsPage;

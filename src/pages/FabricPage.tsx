
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { FabricDialog } from '@/components/masters/FabricDialog';
import { FabricsList } from '@/components/masters/FabricsList';
import { useFabrics } from '@/hooks/masters/useFabrics';

const FabricPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: fabrics = [] } = useFabrics();

  const handleAdd = () => {
    setDialogOpen(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export fabric clicked');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import fabric clicked');
  };

  const filteredFabrics = fabrics.filter((fabric) =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.fabric_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Fabric"
        description="Manage fabric types, properties, and specifications"
        icon={<Scissors className="h-6 w-6 text-amber-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={fabrics.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search fabric..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredFabrics.length}
            totalCount={fabrics.length}
          />
          
          <div className="mt-6">
            <FabricsList searchTerm={searchTerm} />
          </div>
        </CardContent>
      </Card>

      <FabricDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default FabricPage;

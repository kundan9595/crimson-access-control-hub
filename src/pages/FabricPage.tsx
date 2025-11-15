
import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Scissors } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { FabricDialog } from '@/components/masters/FabricDialog';
import { FabricsList } from '@/components/masters/FabricsList';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useFabrics } from '@/hooks/masters/useFabrics';

const FabricPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const { data: fabrics = [] } = useFabrics();

  const handleAdd = () => {
    setDialogOpen(true);
  };

  const handleExport = () => {
    if (!fabrics || fabrics.length === 0) return;

    const csvContent = [
      ['Name', 'Fabric Type', 'GSM', 'UOM', 'Price', 'Colors (comma-separated)', 'Status', 'Created At'].join(','),
      ...fabrics.map(fabric => [
        `"${fabric.name}"`,
        fabric.fabric_type,
        fabric.gsm,
        fabric.uom,
        fabric.price,
        fabric.colors && fabric.colors.length > 0 
          ? `"${fabric.colors.map(c => c.name).join(', ')}"` 
          : '',
        fabric.status,
        new Date(fabric.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabrics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setBulkImportOpen(true);
  };

  const filteredFabrics = fabrics.filter((fabric) =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.fabric_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Fabrics"
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

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="fabrics"
      />
    </div>
  );
};

export default FabricPage;

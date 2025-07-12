
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { PartDialog } from '@/components/masters/PartDialog';
import { PartsList } from '@/components/masters/PartsList';
import { useParts, useCreatePart, useUpdatePart, useDeletePart } from '@/hooks/masters/useParts';
import { Part } from '@/services/masters/partsService';
import { toast } from '@/hooks/use-toast';

const PartsPage = () => {
  console.log('🏗️ PartsPage - Rendering');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | undefined>();

  const { data: parts = [], isLoading } = useParts();
  const createPartMutation = useCreatePart();
  const updatePartMutation = useUpdatePart();
  const deletePartMutation = useDeletePart();

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    console.log('➕ Adding new part');
    setEditingPart(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (part: Part) => {
    console.log('✏️ Editing part:', part);
    setEditingPart(part);
    setDialogOpen(true);
  };

  const handleDelete = async (part: Part) => {
    console.log('🗑️ Deleting part:', part);
    if (window.confirm(`Are you sure you want to delete "${part.name}"?`)) {
      try {
        await deletePartMutation.mutateAsync(part.id);
      } catch (error) {
        console.error('❌ Error deleting part:', error);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    console.log('💾 Submitting part data:', data);
    try {
      if (editingPart) {
        await updatePartMutation.mutateAsync({
          id: editingPart.id,
          updates: data,
        });
      } else {
        await createPartMutation.mutateAsync(data);
      }
      setDialogOpen(false);
      setEditingPart(undefined);
    } catch (error) {
      console.error('❌ Error submitting part:', error);
    }
  };

  const handleExport = () => {
    console.log('📤 Export parts clicked');
    toast({
      title: "Export functionality",
      description: "Export feature will be implemented soon",
    });
  };

  const handleImport = () => {
    console.log('📥 Import parts clicked');
    toast({
      title: "Import functionality", 
      description: "Import feature will be implemented soon",
    });
  };

  if (isLoading) {
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
            <div className="text-center py-8 text-muted-foreground">
              Loading parts...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Parts"
        description="Define and manage product parts and components"
        icon={<Wrench className="h-6 w-6 text-slate-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={parts.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search parts..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredParts.length}
            totalCount={parts.length}
          />
          
          <div className="mt-6">
            {filteredParts.length > 0 ? (
              <PartsList
                parts={filteredParts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <>
                    <p>No parts found matching "{searchTerm}"</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </>
                ) : (
                  <>
                    <p>No parts found</p>
                    <p className="text-sm">Click "Add Part" to create your first part entry</p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        part={editingPart}
        onSubmit={handleSubmit}
        isSubmitting={createPartMutation.isPending || updatePartMutation.isPending}
      />
    </div>
  );
};

export default PartsPage;

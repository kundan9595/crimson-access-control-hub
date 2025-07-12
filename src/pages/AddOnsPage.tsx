
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, Plus } from 'lucide-react';
import { AddOnDialog } from '@/components/masters/AddOnDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import EntityImage from '@/components/ui/EntityImage';
import { useAddOns, useDeleteAddOn, useCreateAddOn, useUpdateAddOn } from '@/hooks/masters/useAddOns';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AddOnsPage = () => {
  const { data: addOns = [], isLoading } = useAddOns();
  const deleteAddOnMutation = useDeleteAddOn();
  const createAddOnMutation = useCreateAddOn();
  const updateAddOnMutation = useUpdateAddOn();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const filteredAddOns = addOns.filter(addOn =>
    addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addOn.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAddOns = [...filteredAddOns].sort((a, b) => {
    const orderA = a.display_order || 0;
    const orderB = b.display_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  const handleEdit = (addOn) => {
    setEditingAddOn(addOn);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this add-on?')) {
      deleteAddOnMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAddOn(null);
  };

  const handleDialogSubmit = (data) => {
    if (editingAddOn) {
      updateAddOnMutation.mutate({ id: editingAddOn.id, data });
    } else {
      createAddOnMutation.mutate(data);
    }
    setDialogOpen(false);
    setEditingAddOn(null);
  };

  const handleExport = () => {
    if (!addOns || addOns.length === 0) return;
    const csvContent = [
      ['Name', 'Description', 'Select Type', 'Options Count', 'Display Order', 'Status', 'Created At'].join(','),
      ...addOns.map(addOn => [
        `"${addOn.name}"`,
        `"${addOn.description || ''}"`,
        addOn.select_type,
        addOn.options?.length || 0,
        addOn.display_order || 0,
        addOn.status,
        new Date(addOn.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `add-ons-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="text-center">Loading add-ons...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Add Ons"
        description="Configure additional features and add-on components"
        icon={<Plus className="h-6 w-6 text-lime-600" />}
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={addOns.length > 0}
      />
      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search add-ons..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedAddOns.length}
            totalCount={addOns.length}
          />
          <div className="mt-6">
            {sortedAddOns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Select Type</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="w-20">Display Order</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAddOns.map((addOn) => (
                    <TableRow key={addOn.id}>
                      <TableCell>
                        <div className="w-10 h-10 relative">
                          {addOn.image_url ? (
                            <img
                              src={addOn.image_url}
                              alt={`${addOn.name} image`}
                              className="w-full h-full object-cover rounded border bg-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-muted rounded border text-muted-foreground text-xs ${addOn.image_url ? 'hidden' : ''}`}>
                            <Settings className="h-4 w-4" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{addOn.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{addOn.description || '-'}</TableCell>
                      <TableCell>{addOn.select_type}</TableCell>
                      <TableCell>{addOn.options?.length || 0}</TableCell>
                      <TableCell className="text-center">{addOn.display_order || 0}</TableCell>
                      <TableCell>
                        <Badge variant={addOn.status === 'active' ? 'default' : 'secondary'}>
                          {addOn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(addOn.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(addOn)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(addOn.id)}
                            disabled={deleteAddOnMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* handle manage options modal here */}}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No add-ons found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AddOnDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        addOn={editingAddOn}
        onSubmit={handleDialogSubmit}
        isSubmitting={createAddOnMutation.isPending || updateAddOnMutation.isPending}
      />
      {/*
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="brands" // Use a supported type or remove for add-ons
        templateHeaders={['Name', 'Description', 'Select Type', 'Options', 'Display Order', 'Status']}
        sampleData={[
          ['Gift Wrap', 'Gift wrapping service', 'single', '2', '1', 'active'],
          ['Warranty', 'Extended warranty', 'multiple', '3', '2', 'active']
        ]}
      />
      */}
    </div>
  );
};

export default AddOnsPage;

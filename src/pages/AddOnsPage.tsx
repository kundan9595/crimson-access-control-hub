import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Package } from 'lucide-react';
import { AddOnDialog } from '@/components/masters/AddOnDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useAddOns, useCreateAddOn, useUpdateAddOn, useDeleteAddOn, type AddOnFilter } from '@/hooks/masters/useAddOns';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchAddOns } from '@/services/masters/addOnsServiceScott';
import { config } from '@/config/environment';

const AddOnsPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const filters: AddOnFilter | undefined = searchTerm ? { search: searchTerm } : undefined;
  const { data: addOnsPage, isLoading } = useAddOns(page, pageSize, filters);
  const addOns = addOnsPage?.data ?? [];
  const deleteAddOnMutation = useDeleteAddOn();
  const createAddOnMutation = useCreateAddOn();
  const updateAddOnMutation = useUpdateAddOn();
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Sort addOns by sort_order, then by name (server-side search returns filtered results)
  const sortedAddOns = [...addOns].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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

  const handleDialogSubmit = (data, imageFile) => {
    if (editingAddOn) {
      updateAddOnMutation.mutate({ id: editingAddOn.id, data, imageFile });
    } else {
      createAddOnMutation.mutate({ data, imageFile });
    }
    setDialogOpen(false);
    setEditingAddOn(null);
  };

  const handleExport = async () => {
    const all = await fetchAddOns();
    if (!all.length) return;

    const csvContent = [
      ['Name', 'Group Name', 'Add On OF', 'Add On SN', 'Select Type', 'Price', 'Has Color', 'Sort Order', 'Layer Sort', 'Status', 'Created At'].join(','),
      ...all.map((addOn) => [
        `"${addOn.name}"`,
        `"${addOn.group_name || ''}"`,
        `"${addOn.add_on_of || ''}"`,
        `"${addOn.add_on_sn || ''}"`,
        addOn.select_type,
        addOn.price || 0,
        addOn.has_color ? 'Yes' : 'No',
        addOn.sort_order || 0,
        addOn.layer_sort || 0,
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
    return (
      <MasterListPageSkeleton
        columnCount={14}
        header={
          <MasterPageHeader
            title="Add Ons"
            description="Configure additional features and add-on components"
            icon={<Package className="h-6 w-6 text-lime-600" />}
            onAdd={() => setDialogOpen(true)}
            onExport={handleExport}
            onImport={() => setBulkImportOpen(true)}
            canExport={!!addOnsPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Add Ons"
        description="Configure additional features and add-on components"
        icon={<Plus className="h-6 w-6 text-lime-600" />}
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={!!addOnsPage?.data.length}
        isScottApi={true}
      />
      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search add-ons..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedAddOns.length}
            totalCount={
              addOnsPage?.totalCountIsExact ? addOnsPage.totalCount : addOns.length
            }
          />
          <div className="mt-6">
            {sortedAddOns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Add On OF</TableHead>
                    <TableHead>Add On SN</TableHead>
                    <TableHead>Select Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead className="w-20">Sort Order</TableHead>
                    <TableHead className="w-20">Layer</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
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
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted rounded border">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{addOn.name}</TableCell>
                      <TableCell>{addOn.group_name || '-'}</TableCell>
                      <TableCell>{addOn.add_on_of || '-'}</TableCell>
                      <TableCell>{addOn.add_on_sn || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {addOn.select_type}
                        </Badge>
                      </TableCell>
                      <TableCell>${addOn.price || 0}</TableCell>
                      <TableCell>
                        {addOn.has_color ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{addOn.sort_order || 0}</TableCell>
                      <TableCell className="text-center">{addOn.layer_sort || 0}</TableCell>
                      <TableCell>
                        <Badge variant={addOn.status === 'active' ? 'default' : 'secondary'}>
                          {addOn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(addOn.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(addOn.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(addOn)}>
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

          {addOnsPage && addOnsPage.data.length > 0 && (
            <MasterServerPagination
              className="mt-6"
              result={addOnsPage}
              disabled={isLoading}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>

      <AddOnDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        addOn={editingAddOn}
        onSubmit={handleDialogSubmit}
        isSubmitting={createAddOnMutation.isPending || updateAddOnMutation.isPending}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="add-ons"
        templateHeaders={['Name', 'Group Name', 'Add On OF', 'Add On SN', 'Select Type', 'Price', 'Has Color', 'Sort Order', 'Layer Sort', 'Status']}
        sampleData={[
          ['Premium Quality', 'Materials', '1', '101', 'single', '5.99', 'Yes', '1', '0', 'active'],
          ['Express Delivery', 'Services', '2', '201', 'checked', '12.99', 'No', '2', '0', 'active']
        ]}
      />
    </div>
  );
};

export default AddOnsPage;

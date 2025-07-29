
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Users } from 'lucide-react';
import { useVendors, useDeleteVendor, useStyles, useStates, useCities } from '@/hooks/useMasters';
import { Vendor } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import VendorDialog from '@/components/masters/VendorDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const VendorsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const { data: vendors, isLoading } = useVendors();
  const { data: styles = [] } = useStyles();
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities();
  const deleteVendor = useDeleteVendor();

  // Helper functions to get state and city names
  const getStateName = (stateId: string) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : '-';
  };

  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : '-';
  };

  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      deleteVendor.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVendor(null);
    setSearchParams({});
  };

  const handleExport = () => {
    if (!filteredVendors?.length) return;

    const csvContent = [
      ['Name', 'Code', 'Description', 'Contact Person', 'Email', 'Phone', 'Status', 'Created Date'].join(','),
      ...filteredVendors.map(vendor => [
        `"${vendor.name}"`,
        `"${vendor.code}"`,
        `"${vendor.description || ''}"`,
        `"${vendor.contact_person || ''}"`,
        `"${vendor.email || ''}"`,
        `"${vendor.phone || ''}"`,
        vendor.status,
        new Date(vendor.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateHeaders = ['Name', 'Code', 'Description', 'Contact Person', 'Email', 'Phone', 'Status'];
  const sampleData = [
    ['ABC Suppliers', 'ABC001', 'General merchandise supplier', 'John Doe', 'john@abc.com', '+1234567890', 'active'],
    ['XYZ Trading', 'XYZ001', 'Electronics supplier', 'Jane Smith', 'jane@xyz.com', '+0987654321', 'active']
  ];

  if (isLoading) {
    return <div className="text-center">Loading vendors...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Vendors"
        description="Manage supplier and vendor information"
        icon={<Users className="h-6 w-6 text-blue-600" />}
        onAdd={() => setIsDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setIsBulkImportOpen(true)}
        canExport={!!filteredVendors?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredVendors.length}
            totalCount={vendors?.length || 0}
          />
          
          <div className="mt-6">
            {filteredVendors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Specialisations</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vendor.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{vendor.description || '-'}</TableCell>
                      <TableCell>{vendor.contact_person || '-'}</TableCell>
                      <TableCell>{vendor.email || '-'}</TableCell>
                      <TableCell>{vendor.phone || '-'}</TableCell>
                      <TableCell>{vendor.state_id ? getStateName(vendor.state_id) : '-'}</TableCell>
                      <TableCell>{vendor.city_id ? getCityName(vendor.city_id) : '-'}</TableCell>
                      <TableCell>
                        {vendor.style_specializations && vendor.style_specializations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {vendor.style_specializations.slice(0, 3).map((styleId) => {
                              const style = styles.find(s => s.id === styleId);
                              return style ? (
                                <Badge key={styleId} variant="outline" className="text-xs">
                                  {style.name}
                                </Badge>
                              ) : null;
                            })}
                            {vendor.style_specializations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.style_specializations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vendor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vendor.id)}
                            disabled={deleteVendor.isPending}
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
                <p>No vendors found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <VendorDialog
        vendor={editingVendor}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="vendors"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default VendorsPage;

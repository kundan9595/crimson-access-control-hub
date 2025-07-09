
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { useVendors, useDeleteVendor } from '@/hooks/useMasters';
import { Vendor } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import VendorDialog from '@/components/masters/VendorDialog';

const VendorsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  
  const { data: vendors, isLoading } = useVendors();
  const deleteVendor = useDeleteVendor();

  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Vendors
          </h1>
          <p className="text-muted-foreground">Manage supplier and vendor information</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Vendors</CardTitle>
          <CardDescription>Find vendors by name, code, contact person, or email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredVendors?.map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                    <Badge variant="outline">Code: {vendor.code}</Badge>
                    <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                      {vendor.status}
                    </Badge>
                  </div>
                  {vendor.description && (
                    <p className="text-muted-foreground mb-2">{vendor.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                    {vendor.contact_person && (
                      <div>Contact: {vendor.contact_person}</div>
                    )}
                    {vendor.email && (
                      <div>Email: {vendor.email}</div>
                    )}
                    {vendor.phone && (
                      <div>Phone: {vendor.phone}</div>
                    )}
                    {vendor.tax_id && (
                      <div>Tax ID: {vendor.tax_id}</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(vendor.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No vendors match your search criteria.' : 'Get started by creating your first vendor.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <VendorDialog
        vendor={editingVendor}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </div>
  );
};

export default VendorsPage;

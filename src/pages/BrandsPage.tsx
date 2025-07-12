
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package } from 'lucide-react';
import { useBrands, useDeleteBrand } from '@/hooks/masters/useBrands';
import { useSearchParams } from 'react-router-dom';
import BrandDialog from '@/components/masters/BrandDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import type { Brand } from '@/services/mastersService';

const BrandsPage = () => {
  const { data: brands, isLoading } = useBrands();
  const deleteBrandMutation = useDeleteBrand();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      deleteBrandMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBrand(null);
  };

  const handleExport = () => {
    if (!brands || brands.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Sort Order', 'Status', 'Created At'].join(','),
      ...brands.map(brand => [
        `"${brand.name}"`,
        `"${brand.description || ''}"`,
        brand.sort_order || 0,
        brand.status,
        new Date(brand.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brands-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort brands by sort_order, then by name
  const sortedBrands = [...filteredBrands].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return <div className="text-center">Loading brands...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Brands"
        description="Manage your product brands"
        icon={<Package className="h-6 w-6 text-blue-600" />}
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={!!brands?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search brands..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedBrands.length}
            totalCount={brands?.length || 0}
          />
          
          <div className="mt-6">
            {sortedBrands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Sort Order</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="w-10 h-10 relative">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={`${brand.name} logo`}
                              className="w-full h-full object-contain rounded border bg-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-muted rounded border text-muted-foreground text-xs ${brand.logo_url ? 'hidden' : ''}`}>
                            <Package className="h-4 w-4" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{brand.description || '-'}</TableCell>
                      <TableCell className="text-center">{brand.sort_order || 0}</TableCell>
                      <TableCell>
                        <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                          {brand.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(brand)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(brand.id)}
                            disabled={deleteBrandMutation.isPending}
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
                <p>No brands found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BrandDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        brand={editingBrand}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="brands"
        templateHeaders={['Name', 'Description', 'Sort Order', 'Status']}
        sampleData={[
          ['Apple', 'Technology company', '1', 'active'],
          ['Samsung', 'Electronics manufacturer', '2', 'active']
        ]}
      />
    </div>
  );
};

export default BrandsPage;

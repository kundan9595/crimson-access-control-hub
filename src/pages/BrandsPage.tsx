
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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
      ['Name', 'Description', 'Status', 'Created At'].join(','),
      ...brands.map(brand => [
        `"${brand.name}"`,
        `"${brand.description || ''}"`,
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

  if (isLoading) {
    return <div className="text-center">Loading brands...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Brands"
        description="Manage your product brands"
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
            resultCount={filteredBrands.length}
            totalCount={brands?.length || 0}
          />
          
          <div className="mt-6">
            {filteredBrands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{brand.description || '-'}</TableCell>
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
        templateHeaders={['Name', 'Description', 'Status']}
        sampleData={[
          ['Apple', 'Technology company', 'active'],
          ['Samsung', 'Electronics manufacturer', 'active']
        ]}
      />
    </div>
  );
};

export default BrandsPage;

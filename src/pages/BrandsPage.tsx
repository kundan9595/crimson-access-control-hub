
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Package, Table2, LayoutGrid, Eye } from 'lucide-react';
import { useBrands, useDeleteBrand } from '@/hooks/masters/useBrands';
import { useSearchParams } from 'react-router-dom';
import BrandDialog from '@/components/masters/BrandDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import BrandStylesModal from '@/components/masters/BrandStylesModal';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { VirtualList } from '@/components/common';

import type { Brand } from '@/services/mastersService';

type ViewType = 'table' | 'card';

const BrandsPage = () => {
  const { data: brands, isLoading } = useBrands();
  const deleteBrandMutation = useDeleteBrand();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewingBrandStyles, setViewingBrandStyles] = useState<Brand | null>(null);
  const [viewType, setViewType] = useState<ViewType>('table');
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

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      await deleteBrandMutation.mutateAsync(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBrand(null);
  };

  const handleViewStyles = (brand: Brand) => {
    setViewingBrandStyles(brand);
  };

  const handleStylesModalClose = () => {
    setViewingBrandStyles(null);
  };

  const handleExport = async () => {
    if (!brands || brands.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Logo URL', 'Sort Order', 'Status', 'Created At'].join(','),
      ...brands.map(brand => [
        `"${brand.name}"`,
        `"${brand.description || ''}"`,
        `"${brand.logo_url || ''}"`,
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

  // Render brand row for virtual list
  const renderBrandRow = (brand: Brand) => (
    <TableRow key={brand.id} className="hover:bg-muted/50">
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
            onClick={() => handleViewStyles(brand)}
            title="View Styles"
          >
            <Eye className="h-4 w-4" />
          </Button>
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
  );

  if (isLoading) {
    return <div className="text-center">Loading brands...</div>;
  }

  return (
    <div className="space-y-6">
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
          <div className="flex items-center justify-between mb-4">
            <SearchFilter
              placeholder="Search brands..."
              value={searchTerm}
              onChange={setSearchTerm}
              resultCount={sortedBrands.length}
              totalCount={brands?.length || 0}
            />
            <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
              <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <TabsTrigger value="table" className="flex items-center gap-2 px-3 py-2">
                  <Table2 className="w-4 h-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="card" className="flex items-center gap-2 px-3 py-2">
                  <LayoutGrid className="w-4 h-4" />
                  Card
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="mt-6">
            {sortedBrands.length > 0 ? (
              viewType === 'table' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Logo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-32">Created At</TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Use virtual scrolling for large datasets */}
                    {sortedBrands.length > 100 ? (
                      <VirtualList
                        items={sortedBrands}
                        height={600}
                        itemHeight={60}
                        renderItem={renderBrandRow}
                        className="w-full"
                      />
                    ) : (
                      sortedBrands.map(renderBrandRow)
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedBrands.map((brand) => (
                    <Card key={brand.id} className="hover:shadow-md transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="w-full aspect-square bg-muted rounded mb-3 flex items-center justify-center overflow-hidden">
                              {brand.logo_url ? (
                                <img
                                  src={brand.logo_url}
                                  alt={`${brand.name} logo`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${brand.logo_url ? 'hidden' : ''}`}>
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            </div>
                            <h3 className="font-medium text-base truncate mb-1">{brand.name}</h3>
                            {brand.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {brand.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                              {brand.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(brand.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewStyles(brand)}
                              title="View Styles"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Styles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(brand)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
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
      />

      <BrandStylesModal
        open={!!viewingBrandStyles}
        onOpenChange={(open) => {
          if (!open) {
            handleStylesModalClose();
          }
        }}
        brand={viewingBrandStyles}
      />
    </div>
  );
};

export default BrandsPage;

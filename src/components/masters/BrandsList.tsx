
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search } from 'lucide-react';
import { useBrands, useDeleteBrand, useUpdateBrand } from '@/hooks/useMasters';
import BrandDialog from './BrandDialog';
import DraggableList from './shared/DraggableList';
import type { Brand } from '@/services/mastersService';

const BrandsList = () => {
  const { data: brands, isLoading } = useBrands();
  const deleteBrandMutation = useDeleteBrand();
  const updateBrandMutation = useUpdateBrand();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortEnabled, setSortEnabled] = useState(false);

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

  const handleReorder = (reorderedBrands: Brand[]) => {
    // Update each brand with new sort_order
    reorderedBrands.forEach((brand, index) => {
      if (brand.sort_order !== index + 1) {
        updateBrandMutation.mutate({
          id: brand.id,
          updates: { sort_order: index + 1 }
        });
      }
    });
  };

  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort brands by sort_order for consistent display
  const sortedBrands = [...filteredBrands].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    return orderA - orderB;
  });

  const renderBrandItem = (brand: Brand, index: number, isDragging: boolean) => (
    <Card className={isDragging ? 'shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logo_url && (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-12 h-12 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <CardTitle className="text-lg">{brand.name}</CardTitle>
              {brand.description && (
                <CardDescription>{brand.description}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
            {brand.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="text-center">Loading brands...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={sortEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setSortEnabled(!sortEnabled)}
          disabled={filteredBrands.length <= 1}
        >
          {sortEnabled ? 'Done Sorting' : 'Sort Order'}
        </Button>
      </div>

      {sortedBrands.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No brands found
        </div>
      ) : (
        <DraggableList
          items={sortedBrands}
          onReorder={handleReorder}
          renderItem={renderBrandItem}
          className="space-y-4"
          disabled={!sortEnabled || searchTerm.length > 0}
        />
      )}

      <BrandDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        brand={editingBrand}
      />
    </div>
  );
};

export default BrandsList;

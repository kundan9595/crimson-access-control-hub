
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Plus, ArrowLeft } from 'lucide-react';
import { useBrands, useDeleteBrand } from '@/hooks/useMasters';
import { Link, useSearchParams } from 'react-router-dom';
import BrandDialog from '@/components/masters/BrandDialog';
import type { Brand } from '@/services/mastersService';

const BrandsPage = () => {
  const { data: brands, isLoading } = useBrands();
  const deleteBrandMutation = useDeleteBrand();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="text-center">Loading brands...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/masters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Masters
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Brands</h1>
            <p className="text-muted-foreground">Manage all your product brands</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredBrands.length} of {brands?.length || 0} brands
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBrands.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBrands.map((brand) => (
                <Card key={brand.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {brand.logo_url && (
                          <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{brand.name}</CardTitle>
                          <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                            {brand.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {brand.description && (
                      <CardDescription>{brand.description}</CardDescription>
                    )}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No brands found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <BrandDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        brand={editingBrand}
      />
    </div>
  );
};

export default BrandsPage;

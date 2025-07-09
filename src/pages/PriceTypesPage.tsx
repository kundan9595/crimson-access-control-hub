
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, DollarSign } from 'lucide-react';
import { usePriceTypes, useDeletePriceType } from '@/hooks/useMasters';
import { PriceType } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import PriceTypeDialog from '@/components/masters/PriceTypeDialog';

const PriceTypesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPriceType, setEditingPriceType] = useState<PriceType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  
  const { data: priceTypes, isLoading } = usePriceTypes();
  const deletePriceType = useDeletePriceType();

  const filteredPriceTypes = priceTypes?.filter(priceType =>
    priceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (priceType: PriceType) => {
    setEditingPriceType(priceType);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this price type?')) {
      deletePriceType.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPriceType(null);
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
            <DollarSign className="h-8 w-8" />
            Price Types
          </h1>
          <p className="text-muted-foreground">Configure pricing structures and multipliers</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Price Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Price Types</CardTitle>
          <CardDescription>Find price types by name, code, or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search price types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredPriceTypes?.map((priceType) => (
          <Card key={priceType.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{priceType.name}</h3>
                    <Badge variant="outline">Code: {priceType.code}</Badge>
                    {priceType.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Badge variant={priceType.status === 'active' ? 'default' : 'secondary'}>
                      {priceType.status}
                    </Badge>
                  </div>
                  {priceType.description && (
                    <p className="text-muted-foreground mb-2">{priceType.description}</p>
                  )}
                  {priceType.multiplier && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Multiplier: {priceType.multiplier}x
                    </p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(priceType.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(priceType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(priceType.id)}
                    disabled={deletePriceType.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPriceTypes?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Price Types Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No price types match your search criteria.' : 'Get started by creating your first price type.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Price Type
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PriceTypeDialog
        priceType={editingPriceType}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </div>
  );
};

export default PriceTypesPage;

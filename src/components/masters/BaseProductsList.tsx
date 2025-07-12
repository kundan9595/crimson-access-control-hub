
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { useBaseProducts, useDeleteBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import { BaseProductDialog } from './BaseProductDialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export const BaseProductsList: React.FC = () => {
  const { data: baseProducts = [], isLoading } = useBaseProducts();
  const deleteMutation = useDeleteBaseProduct();
  const [editingBaseProduct, setEditingBaseProduct] = useState<BaseProduct | null>(null);
  const [deletingBaseProduct, setDeletingBaseProduct] = useState<BaseProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (baseProduct: BaseProduct) => {
    setEditingBaseProduct(baseProduct);
    setIsDialogOpen(true);
  };

  const handleDelete = (baseProduct: BaseProduct) => {
    setDeletingBaseProduct(baseProduct);
  };

  const confirmDelete = async () => {
    if (deletingBaseProduct) {
      await deleteMutation.mutateAsync(deletingBaseProduct.id);
      setDeletingBaseProduct(null);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBaseProduct(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading base products...</div>
        </CardContent>
      </Card>
    );
  }

  if (baseProducts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>No base products found</p>
            <p className="text-sm">Click "Add Base Product" to create your first base product template</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {baseProducts.map((baseProduct) => (
          <Card key={baseProduct.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{baseProduct.name}</h3>
                    <Badge variant={baseProduct.status === 'active' ? 'default' : 'secondary'}>
                      {baseProduct.status}
                    </Badge>
                  </div>

                  {baseProduct.image_url && (
                    <div className="mb-3">
                      <img
                        src={baseProduct.image_url}
                        alt={baseProduct.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {baseProduct.category && (
                      <div>
                        <span className="font-medium">Category:</span> {baseProduct.category.name}
                      </div>
                    )}
                    {baseProduct.fabric && (
                      <div>
                        <span className="font-medium">Fabric:</span> {baseProduct.fabric.name} ({baseProduct.fabric.fabric_type})
                      </div>
                    )}
                    {baseProduct.calculator && (
                      <div>
                        <span className="font-medium">Calculator:</span> {baseProduct.calculator}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Size Type:</span> {baseProduct.size_type}
                    </div>
                    <div>
                      <span className="font-medium">Base Price:</span> ₹{baseProduct.base_price.toFixed(2)}
                    </div>
                    {baseProduct.parts && baseProduct.parts.length > 0 && (
                      <div>
                        <span className="font-medium">Parts:</span> {baseProduct.parts.length} selected
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(baseProduct)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(baseProduct)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BaseProductDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        baseProduct={editingBaseProduct}
      />

      <AlertDialog open={!!deletingBaseProduct} onOpenChange={() => setDeletingBaseProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Base Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBaseProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

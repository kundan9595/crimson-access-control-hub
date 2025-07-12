
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

export const BaseProductsTable: React.FC = () => {
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
    return <div className="text-center py-8">Loading base products...</div>;
  }

  if (baseProducts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No base products found</p>
        <p className="text-sm">Click "Add Base Product" to create your first base product template</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Fabric</TableHead>
              <TableHead>Size Group</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Calculator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baseProducts.map((baseProduct) => (
              <TableRow key={baseProduct.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {(baseProduct.image_url || baseProduct.base_icon_url) && (
                      <img
                        src={baseProduct.base_icon_url || baseProduct.image_url}
                        alt={baseProduct.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <div className="font-medium">{baseProduct.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {baseProduct.parts?.length || 0} parts selected
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {baseProduct.category?.name || '-'}
                </TableCell>
                <TableCell>
                  {baseProduct.fabric ? (
                    <div>
                      <div>{baseProduct.fabric.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {baseProduct.fabric.fabric_type}
                      </div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {baseProduct.size_group?.name || '-'}
                </TableCell>
                <TableCell>
                  ₹{baseProduct.base_price.toFixed(2)}
                </TableCell>
                <TableCell>
                  {baseProduct.calculator?.toFixed(2) || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={baseProduct.status === 'active' ? 'default' : 'secondary'}>
                    {baseProduct.status}
                  </Badge>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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


import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useBaseProducts, useDeleteBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import {
  getBaseProductUnitPriceForDisplay,
  type ScottBaseProduct,
} from '@/services/masters/baseProductsServiceScott';
import { BaseProductDialog } from './BaseProductDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { hasNextScottPage } from '@/services/scott/scottPagination';
import { config } from '@/config/environment';

export const BaseProductsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const { data: pageResult, isLoading, isFetching } = useBaseProducts(page, pageSize);
  const rows = pageResult?.data ?? [];
  const deleteMutation = useDeleteBaseProduct();
  const [editingBaseProduct, setEditingBaseProduct] = useState<BaseProduct | null>(null);
  const [deletingBaseProduct, setDeletingBaseProduct] = useState<BaseProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (baseProduct: ScottBaseProduct) => {
    setEditingBaseProduct(baseProduct as unknown as BaseProduct);
    setIsDialogOpen(true);
  };

  const handleDelete = (baseProduct: ScottBaseProduct) => {
    setDeletingBaseProduct(baseProduct as unknown as BaseProduct);
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
          <MasterTableSkeleton showToolbar={false} columnCount={7} className="space-y-0" />
        </CardContent>
      </Card>
    );
  }

  const emptyCatalog =
    rows.length === 0 &&
    page === 1 &&
    pageResult &&
    (pageResult.totalCountIsExact
      ? pageResult.totalCount === 0
      : !hasNextScottPage(pageResult));

  return (
    <>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground rounded-md border">
          {emptyCatalog ? (
            <>
              <p>No base products found</p>
              <p className="text-sm">Create a base product to see it listed here</p>
            </>
          ) : (
            <>
              <p>No base products on this page</p>
              <p className="text-sm text-muted-foreground/90">Try another page or row size</p>
            </>
          )}
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((baseProduct) => (
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
                    {(baseProduct as BaseProduct).category && (
                      <div>
                        <span className="font-medium">Category:</span>{' '}
                        {(baseProduct as BaseProduct).category!.name}
                      </div>
                    )}
                    {(baseProduct as BaseProduct).fabric && (
                      <div>
                        <span className="font-medium">Fabric:</span>{' '}
                        {(baseProduct as BaseProduct).fabric!.name} (
                        {(baseProduct as BaseProduct).fabric!.fabric_type})
                      </div>
                    )}
                    {(baseProduct as BaseProduct).size_groups &&
                      (baseProduct as BaseProduct).size_groups!.length > 0 && (
                        <div>
                          <span className="font-medium">Size Groups:</span>{' '}
                          {(baseProduct as BaseProduct).size_groups!.map((sg: { name: string }) => sg.name).join(', ')}
                        </div>
                      )}
                    {baseProduct.calculator ? (
                      <div>
                        <span className="font-medium">Calculator:</span>{' '}
                        {baseProduct.calculator.toFixed(2)}
                      </div>
                    ) : null}
                    <div>
                      <span className="font-medium">Base OF:</span>{' '}
                      ₹{getBaseProductUnitPriceForDisplay(baseProduct).toFixed(2)}
                    </div>
                    {(baseProduct as BaseProduct).parts &&
                      (baseProduct as BaseProduct).parts!.length > 0 && (
                        <div>
                          <span className="font-medium">Parts:</span>{' '}
                          {(baseProduct as BaseProduct).parts!.length} selected
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
      )}

      <div className="mt-4">
        <MasterServerPagination
          result={pageResult ?? null}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={isFetching}
        />
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
              Are you sure you want to delete "{deletingBaseProduct?.name}"? This action cannot be
              undone.
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

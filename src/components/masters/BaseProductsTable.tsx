
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
import { useDeleteBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import {
  getBaseProductUnitPriceForDisplay,
  type ScottBaseProduct,
} from '@/services/masters/baseProductsServiceScott';
import type { ScottPaginatedResult } from '@/services/scott/scottPagination';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
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
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';

type BaseProductsTableProps = {
  rows: ScottBaseProduct[];
  isLoading: boolean;
  paginationDisabled?: boolean;
  paginated?: ScottPaginatedResult<ScottBaseProduct> | null;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export const BaseProductsTable: React.FC<BaseProductsTableProps> = ({
  rows: baseProducts,
  isLoading,
  paginationDisabled,
  paginated,
  onPageChange,
  onPageSizeChange,
}) => {
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
    return <MasterTableSkeleton showToolbar={false} columnCount={18} className="mt-0" />;
  }

  const showPagination =
    Boolean(paginated && onPageChange && onPageSizeChange);

  if (baseProducts.length === 0 && !showPagination) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No base products found</p>
        <p className="text-sm">Click "Add Base Product" to create your first base product template</p>
      </div>
    );
  }

  return (
    <>
      {baseProducts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground rounded-md border">
          <p>No base products on this page</p>
          <p className="text-sm text-muted-foreground/90">Try another page or row size</p>
        </div>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset Info</TableHead>
              <TableHead>Fabric</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Base Of</TableHead>
              <TableHead>Base SN</TableHead>
              <TableHead>Trims Cost</TableHead>
              <TableHead>Adult Cons.</TableHead>
              <TableHead>Kids Cons.</TableHead>
              <TableHead>Overhead %</TableHead>
              <TableHead>Brand Sides</TableHead>
              <TableHead>Sample Rate</TableHead>
              <TableHead>Calculator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baseProducts.map((baseProduct: ScottBaseProduct) => (
              <TableRow key={baseProduct.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {(baseProduct.image_url ||
                      (baseProduct as BaseProduct).base_icon_url) && (
                      <img
                        src={
                          (baseProduct as BaseProduct).base_icon_url ||
                          baseProduct.image_url
                        }
                        alt={baseProduct.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <div className="font-medium">{baseProduct.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {baseProduct.base_product_type?.name || '-'}
                </TableCell>
                <TableCell>
                  {baseProduct.asset_info?.name || '-'}
                </TableCell>
                <TableCell>
                  {(baseProduct as BaseProduct).fabric ? (
                    <div>
                      <div>{(baseProduct as BaseProduct).fabric?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {(baseProduct as BaseProduct).fabric?.fabric_type}
                      </div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  ₹{getBaseProductUnitPriceForDisplay(baseProduct).toFixed(2)}
                </TableCell>
                <TableCell>{baseProduct.base_of ?? '-'}</TableCell>
                <TableCell>{baseProduct.base_sn ?? '-'}</TableCell>
                <TableCell>₹{baseProduct.tims_cost?.toFixed(2) || '-'}</TableCell>
                <TableCell>{baseProduct.adult_consumption?.toFixed(2) || '-'}</TableCell>
                <TableCell>{baseProduct.kids_consumption?.toFixed(2) || '-'}</TableCell>
                <TableCell>{baseProduct.over_header_percentage?.toFixed(1) || '-'}%</TableCell>
                <TableCell>{baseProduct.branding_sides ?? '-'}</TableCell>
                <TableCell>₹{baseProduct.sample_rate?.toFixed(2) || '-'}</TableCell>
                <TableCell>
                  {baseProduct.calculator?.toFixed(2) || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={baseProduct.status === 'active' ? 'default' : 'secondary'}>
                    {baseProduct.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {baseProduct.created_at
                    ? new Date(baseProduct.created_at).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>
                  {baseProduct.updated_at
                    ? new Date(baseProduct.updated_at).toLocaleDateString()
                    : '-'}
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
      )}

      {showPagination && (
        <div className="mt-4">
          <MasterServerPagination
            result={paginated}
            onPageChange={onPageChange!}
            onPageSizeChange={onPageSizeChange!}
            disabled={isLoading || paginationDisabled}
          />
        </div>
      )}

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

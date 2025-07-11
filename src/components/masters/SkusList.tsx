
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useSkus, useDeleteSku } from '@/hooks/masters/useSkus';
import { SkuDialog } from './SkuDialog';
import { Sku } from '@/services/masters/types';

export const SkusList = () => {
  const { data: skus = [], isLoading } = useSkus();
  const deleteMutation = useDeleteSku();
  const [editingSku, setEditingSku] = useState<Sku | undefined>();
  const [deletingSku, setDeletingSku] = useState<Sku | undefined>();
  const [showSkuDialog, setShowSkuDialog] = useState(false);

  const handleEdit = (sku: Sku) => {
    setEditingSku(sku);
    setShowSkuDialog(true);
  };

  const handleDelete = async () => {
    if (deletingSku) {
      await deleteMutation.mutateAsync(deletingSku.id);
      setDeletingSku(undefined);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return `₹${price.toFixed(2)}`;
  };

  const formatDimension = (value: number | null) => {
    if (value === null) return '-';
    return value.toString();
  };

  if (isLoading) {
    return <div>Loading SKUs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU Code</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>HSN Code</TableHead>
              <TableHead>Base MRP</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Dimensions (L×B×H)</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No SKUs found. Create your first SKU to get started.
                </TableCell>
              </TableRow>
            ) : (
              skus.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-medium">{sku.sku_code}</TableCell>
                  <TableCell>
                    {sku.class?.name || '-'}
                    {sku.class?.style?.name && (
                      <div className="text-xs text-muted-foreground">
                        {sku.class.style.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {sku.size?.name || '-'}
                    {sku.size?.code && (
                      <div className="text-xs text-muted-foreground">
                        ({sku.size.code})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{sku.hsn_code || '-'}</TableCell>
                  <TableCell>{formatPrice(sku.base_mrp)}</TableCell>
                  <TableCell>{formatPrice(sku.cost_price)}</TableCell>
                  <TableCell>
                    {sku.length_cm || sku.breadth_cm || sku.height_cm ? (
                      `${formatDimension(sku.length_cm)}×${formatDimension(sku.breadth_cm)}×${formatDimension(sku.height_cm)} cm`
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {sku.weight_grams ? `${sku.weight_grams}g` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sku.status === 'active' ? 'default' : 'secondary'}>
                      {sku.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(sku)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingSku(sku)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SkuDialog
        open={showSkuDialog}
        onOpenChange={(open) => {
          setShowSkuDialog(open);
          if (!open) {
            setEditingSku(undefined);
          }
        }}
        sku={editingSku}
      />

      <AlertDialog open={!!deletingSku} onOpenChange={() => setDeletingSku(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SKU</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSku?.sku_code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

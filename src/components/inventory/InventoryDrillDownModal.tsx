import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Layers, Palette, X } from 'lucide-react';
import { InventoryViewType } from './types';

interface InventoryDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: InventoryViewType;
  itemId: string;
  itemName: string;
  loading?: boolean;
  details?: any[];
}

const InventoryDrillDownModal: React.FC<InventoryDrillDownModalProps> = ({
  isOpen,
  onClose,
  viewType,
  itemId,
  itemName,
  loading = false,
  details = []
}) => {
  const getViewTypeIcon = () => {
    switch (viewType) {
      case 'sku':
        return Package;
      case 'class':
        return Layers;
      case 'style':
        return Palette;
      default:
        return Package;
    }
  };

  const getViewTypeTitle = () => {
    switch (viewType) {
      case 'sku':
        return 'SKU Details';
      case 'class':
        return 'Class Details';
      case 'style':
        return 'Style Details';
      default:
        return 'Details';
    }
  };

  const getTableHeaders = () => {
    switch (viewType) {
      case 'class':
        return ['SKU Code', 'Size', 'Total', 'Reserved', 'Available', 'Warehouse'];
      case 'style':
        return ['Class Name', 'Color', 'Size Group', 'Total', 'Reserved', 'Available'];
      default:
        return [];
    }
  };

  const Icon = getViewTypeIcon();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-5 h-5 text-blue-600" />
              <DialogTitle>{getViewTypeTitle()}</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {itemName}
          </div>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No details available for this {viewType}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getTableHeaders().map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((detail, index) => (
                    <TableRow key={index}>
                      {viewType === 'class' && (
                        <>
                          <TableCell className="font-medium">{detail.sku_code}</TableCell>
                          <TableCell>{detail.size_name}</TableCell>
                          <TableCell className="text-center">{detail.total_quantity}</TableCell>
                          <TableCell className="text-center">{detail.reserved_quantity}</TableCell>
                          <TableCell className="text-center">{detail.available_quantity}</TableCell>
                          <TableCell>{detail.warehouse_name}</TableCell>
                        </>
                      )}
                      {viewType === 'style' && (
                        <>
                          <TableCell className="font-medium">{detail.class_name}</TableCell>
                          <TableCell>{detail.color_name || '-'}</TableCell>
                          <TableCell>{detail.size_group_name || '-'}</TableCell>
                          <TableCell className="text-center">{detail.total_quantity}</TableCell>
                          <TableCell className="text-center">{detail.reserved_quantity}</TableCell>
                          <TableCell className="text-center">{detail.available_quantity}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDrillDownModal; 
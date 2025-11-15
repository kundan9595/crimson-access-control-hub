import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { usePurchaseOrdersByVendor } from '@/hooks/usePurchaseOrdersByVendor';
import type { Vendor } from '@/services/mastersService';
import type { PurchaseOrder } from '@/services/purchaseOrderService';
import { 
  PURCHASE_ORDER_STATUS_LABELS, 
  PURCHASE_ORDER_STATUS_VARIANTS 
} from '@/types/purchaseOrder';
import { PurchaseOrderStatus } from '@/types/purchaseOrder';

interface VendorPOsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}

export const VendorPOsModal: React.FC<VendorPOsModalProps> = ({
  open,
  onOpenChange,
  vendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrdersByVendor(vendor?.id || null);

  const filteredPOs = useMemo(() => {
    if (!searchTerm.trim()) return purchaseOrders;
    
    const searchLower = searchTerm.toLowerCase();
    return purchaseOrders.filter((po: PurchaseOrder) =>
      po.po_number.toLowerCase().includes(searchLower) ||
      po.status.toLowerCase().includes(searchLower) ||
      po.vendor_name?.toLowerCase().includes(searchLower) ||
      po.notes?.toLowerCase().includes(searchLower)
    );
  }, [purchaseOrders, searchTerm]);

  // Sort POs by created_at (newest first)
  const sortedPOs = useMemo(() => {
    return [...filteredPOs].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredPOs]);

  const handleClose = () => {
    setSearchTerm('');
    onOpenChange(false);
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const label = PURCHASE_ORDER_STATUS_LABELS[status] || status;
    const variant = PURCHASE_ORDER_STATUS_VARIANTS[status] || 'secondary';
    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Purchase Orders for {vendor?.name || 'Vendor'}
          </DialogTitle>
          <DialogDescription>
            View and search all purchase orders for this vendor
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number, status, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading purchase orders...'
            ) : (
              <>
                Showing {filteredPOs.length} of {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            )}
          </div>

          {/* Purchase Orders Table */}
          <div className="flex-1 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading purchase orders...
              </div>
            ) : sortedPOs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No purchase orders found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Item Count</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="w-32">Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPOs.map((po: PurchaseOrder) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>
                        {getStatusBadge(po.status as PurchaseOrderStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{po.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{po.item_count}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {po.notes || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(po.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(po.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorPOsModal;


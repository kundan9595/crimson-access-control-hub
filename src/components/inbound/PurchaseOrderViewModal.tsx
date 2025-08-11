import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Package,
  FileText,
  Calendar,
  User,
  Building2,
  Calculator
} from 'lucide-react';
import { purchaseOrderService, PurchaseOrderDetails } from '@/services/purchaseOrderService';
import { PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_VARIANTS } from '@/types/purchaseOrder';
import { toast } from 'sonner';

interface PurchaseOrderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string | null;
  onRefresh?: () => void;
}

const PurchaseOrderViewModal: React.FC<PurchaseOrderViewModalProps> = ({
  isOpen,
  onClose,
  poId,
  onRefresh
}) => {
  const [poDetails, setPoDetails] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && poId) {
      fetchPurchaseOrderDetails();
    }
  }, [isOpen, poId]);

  const fetchPurchaseOrderDetails = async () => {
    if (!poId) return;
    
    try {
      setLoading(true);
      const details = await purchaseOrderService.getPurchaseOrderDetails(poId);
      setPoDetails(details);
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast.error('Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PurchaseOrderStatus) => {
    if (!poId) return;

    try {
      setUpdating(true);
      await purchaseOrderService.updatePurchaseOrderStatus(poId, newStatus);
      
      // Refresh the data
      await fetchPurchaseOrderDetails();
      
      // Show success message
      const statusMessages = {
        [PurchaseOrderStatus.SENT_FOR_APPROVAL]: 'Purchase order sent for approval',
        [PurchaseOrderStatus.SENT_TO_VENDOR]: 'Purchase order sent to vendor',
        [PurchaseOrderStatus.CANCELLED]: 'Purchase order cancelled'
      };
      
      toast.success(statusMessages[newStatus] || 'Status updated successfully');
      
      // Refresh parent component
      onRefresh?.();
    } catch (error) {
      console.error('Error updating PO status:', error);
      toast.error('Failed to update purchase order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!poId) return;

    if (!confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdating(true);
      await purchaseOrderService.deletePurchaseOrder(poId);
      toast.success('Purchase order deleted successfully');
      onClose();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting PO:', error);
      toast.error('Failed to delete purchase order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    return (
      <Badge variant={PURCHASE_ORDER_STATUS_VARIANTS[status]}>
        {PURCHASE_ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const canSendForApproval = poDetails?.po.status === PurchaseOrderStatus.DRAFT;
  const canSendToVendor = poDetails?.po.status === PurchaseOrderStatus.APPROVED;
  const canCancel = [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SENT_FOR_APPROVAL].includes(poDetails?.po.status || PurchaseOrderStatus.DRAFT);

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading purchase order details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!poDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Purchase order not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Purchase Order Details
          </DialogTitle>
          <DialogDescription>
            View and manage purchase order {poDetails.po.po_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {poDetails.po.po_number}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(poDetails.po.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Vendor Information</h4>
                  <p className="text-sm text-muted-foreground">{poDetails.po.vendor_name}</p>
                  <p className="text-sm text-muted-foreground">{poDetails.po.vendor_email}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(poDetails.po.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Amount: ₹{poDetails.po.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
              {poDetails.po.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{poDetails.po.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SKU Items */}
          {poDetails.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  SKU Items ({poDetails.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poDetails.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sku_code}</TableCell>
                        <TableCell>{item.sku_name}</TableCell>
                        <TableCell>{item.size_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{item.total_price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Misc Items */}
          {poDetails.misc_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Miscellaneous Items ({poDetails.misc_items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poDetails.misc_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">₹{item.total_price.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">SKU Items Total:</span>
                  <span className="font-medium">
                    ₹{poDetails.items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Miscellaneous Items Total:</span>
                  <span className="font-medium">
                    ₹{poDetails.misc_items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-lg font-bold">Overall Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{poDetails.po.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canSendForApproval && (
                <Button
                  onClick={() => handleStatusUpdate(PurchaseOrderStatus.SENT_FOR_APPROVAL)}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send for Approval
                </Button>
              )}
              
              {canSendToVendor && (
                <Button
                  onClick={() => handleStatusUpdate(PurchaseOrderStatus.SENT_TO_VENDOR)}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send to Vendor
                </Button>
              )}
              
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate(PurchaseOrderStatus.CANCELLED)}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel PO
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Print
              </Button>
              
              {poDetails.po.status === PurchaseOrderStatus.DRAFT && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
              
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderViewModal;

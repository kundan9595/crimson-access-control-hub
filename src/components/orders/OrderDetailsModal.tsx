import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  MapPin, 
  Building2, 
  Package, 
  CalendarDays, 
  CreditCard, 
  FileText,
  ShoppingCart,
  Calculator,
  Truck,
  Receipt,
  Edit,
  Loader2
} from 'lucide-react';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import { ordersService } from '@/services/orders/ordersService';
import type { Order } from '@/services/orders/types';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onEdit?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onOpenChange,
  order,
  onEdit
}) => {
  const { data: priceTypes = [] } = usePriceTypes();
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(order);

  useEffect(() => {
    if (open && order) {
      // If order_items are not loaded, fetch full order details
      if (!order.order_items || order.order_items.length === 0) {
        fetchOrderDetails();
      } else {
        setOrderDetails(order);
      }
    }
  }, [open, order]);

  const fetchOrderDetails = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      const fullOrder = await ordersService.getOrderById(order.id);
      setOrderDetails(fullOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!orderDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription className="sr-only">
              View order details
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading order details...</span>
              </div>
            ) : (
              <p>Order not found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getTotalQuantity = () => {
    return (orderDetails.order_items || []).reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalDiscount = () => {
    return orderDetails.discount_amount || 0;
  };

  const getTotalGST = () => {
    return (orderDetails.order_items || []).reduce((total, item) => total + (item.gst_amount || 0), 0);
  };

  const getSubtotalBeforeDiscount = () => {
    return (orderDetails.order_items || []).reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleEdit = () => {
    if (onEdit && orderDetails) {
      onEdit(orderDetails);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details - {orderDetails.order_number}
              </DialogTitle>
              <DialogDescription className="sr-only">
                View complete order information including items, addresses, and summary
              </DialogDescription>
            </div>
            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Order
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {orderDetails.order_items?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getTotalQuantity()}</div>
              <div className="text-sm text-muted-foreground">Total Quantity</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ₹{orderDetails.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
          </div>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Order Number</TableCell>
                    <TableCell>{orderDetails.order_number}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Customer</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{orderDetails.customer?.company_name}</div>
                        <div className="text-sm text-muted-foreground">{orderDetails.customer?.customer_code}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Price Type</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {orderDetails.price_type?.name || 'Default (Base MRP)'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>
                      <Badge variant="outline">{orderDetails.status}</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Payment Mode</TableCell>
                    <TableCell>
                      <Badge variant="outline">{orderDetails.payment_mode.replace('_', ' ')}</Badge>
                    </TableCell>
                  </TableRow>
                  {orderDetails.expected_delivery_date && (
                    <TableRow>
                      <TableCell className="font-medium">Expected Delivery</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(orderDetails.expected_delivery_date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {orderDetails.shipment_time && (
                            <span className="text-muted-foreground">at {orderDetails.shipment_time}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {orderDetails.order_remarks && (
                    <TableRow>
                      <TableCell className="font-medium">Order Remarks</TableCell>
                      <TableCell>{orderDetails.order_remarks}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Ship To Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{orderDetails.ship_to_address.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {orderDetails.ship_to_address.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {orderDetails.ship_to_address.city?.name}, {orderDetails.ship_to_address.state?.name} - {orderDetails.ship_to_address.postal_code}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {orderDetails.ship_to_address.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bill To Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{orderDetails.bill_to_address.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {orderDetails.bill_to_address.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {orderDetails.bill_to_address.city?.name}, {orderDetails.bill_to_address.state?.name} - {orderDetails.bill_to_address.postal_code}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {orderDetails.bill_to_address.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          {orderDetails.order_items && orderDetails.order_items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Order Items ({orderDetails.order_items.length})</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-24">Discount</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                    <TableHead className="w-24 text-right">GST Rate</TableHead>
                    <TableHead className="w-32 text-right">GST Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDetails.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {item.item_type === 'sku' ? item.sku?.sku_code : item.misc_name}
                            </span>
                            <Badge variant={item.item_type === 'sku' ? 'default' : 'secondary'} className="text-xs">
                              {item.item_type === 'sku' ? 'SKU' : 'Misc'}
                            </Badge>
                          </div>
                          {item.item_type === 'sku' && (
                            <div className="text-sm text-muted-foreground">
                              {item.sku?.class?.name} - {item.size?.name}
                              {item.sku?.class?.style?.brand?.name && (
                                <span> • {item.sku.class.style.brand.name}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        ₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{item.discount_percentage}%</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.item_type === 'sku' ? (
                          <span className="text-sm">
                            {item.gst_rate ? `${item.gst_rate}%` : '0%'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.item_type === 'sku' ? (
                          <span>₹{(item.gst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Order Summary</h3>
            </div>
            <Table>
              <TableBody>
                {getTotalDiscount() > 0 ? (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">Subtotal (before discount)</TableCell>
                      <TableCell className="text-right">
                        ₹{getSubtotalBeforeDiscount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-green-600">Total Discount</TableCell>
                      <TableCell className="text-right text-green-600">
                        -₹{getTotalDiscount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Subtotal (after discount)</TableCell>
                      <TableCell className="text-right">
                        ₹{orderDetails.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell className="font-medium">Subtotal</TableCell>
                    <TableCell className="text-right">
                      ₹{orderDetails.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )}
                {getTotalGST() > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">Total GST</TableCell>
                    <TableCell className="text-right">
                      ₹{getTotalGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold text-lg">Total Amount</TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    ₹{orderDetails.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="text-sm text-muted-foreground text-center mt-4">
              Total Items: {orderDetails.order_items?.length || 0} | Total Quantity: {getTotalQuantity()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


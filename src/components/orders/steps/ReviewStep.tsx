import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Receipt
} from 'lucide-react';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import type { OrderFormData } from '@/services/orders/types';

interface ReviewStepProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
}) => {
  const { data: priceTypes = [] } = usePriceTypes();
  const getTotalAmount = () => {
    return formData.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const getTotalQuantity = () => {
    return formData.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalDiscount = () => {
    return formData.items.reduce((total, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = (itemSubtotal * item.discount_percentage) / 100;
      return total + discountAmount;
    }, 0);
  };

  const getSubtotalBeforeDiscount = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{formData.items.length}</div>
          <div className="text-sm text-muted-foreground">Items</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{getTotalQuantity()}</div>
          <div className="text-sm text-muted-foreground">Total Quantity</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            ₹{getTotalAmount().toLocaleString('en-IN')}
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
                <TableCell className="font-medium">Customer ID</TableCell>
                <TableCell>{formData.customer_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Price Type</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formData.price_type_id 
                      ? priceTypes.find(pt => pt.id === formData.price_type_id)?.name || 'Unknown'
                      : 'Default (Base MRP)'
                    }
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Payment Mode</TableCell>
                <TableCell>
                  <Badge variant="outline">{formData.payment_mode.replace('_', ' ')}</Badge>
                </TableCell>
              </TableRow>
              {formData.expected_delivery_date && (
                <TableRow>
                  <TableCell className="font-medium">Expected Delivery</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(formData.expected_delivery_date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {formData.shipment_time && (
                        <span className="text-muted-foreground">at {formData.shipment_time}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {formData.order_remarks && (
                <TableRow>
                  <TableCell className="font-medium">Order Remarks</TableCell>
                  <TableCell>{formData.order_remarks}</TableCell>
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
              <div className="font-medium">{formData.ship_to_address.label}</div>
              <div className="text-sm text-muted-foreground">
                {formData.ship_to_address.address}
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.ship_to_address.city.name}, {formData.ship_to_address.state.name} - {formData.ship_to_address.postal_code}
              </div>
              <Badge variant="secondary" className="text-xs">
                {formData.ship_to_address.type}
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
              <div className="font-medium">{formData.bill_to_address.label}</div>
              <div className="text-sm text-muted-foreground">
                {formData.bill_to_address.address}
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.bill_to_address.city.name}, {formData.bill_to_address.state.name} - {formData.bill_to_address.postal_code}
              </div>
              <Badge variant="secondary" className="text-xs">
                {formData.bill_to_address.type}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Order Items ({formData.items.length})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-24">Quantity</TableHead>
              <TableHead className="w-32">Unit Price</TableHead>
              <TableHead className="w-24">Discount</TableHead>
              <TableHead className="w-32 text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.items.map((item) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Order Summary</h3>
        </div>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Subtotal (before discount)</TableCell>
              <TableCell className="text-right">
                ₹{getSubtotalBeforeDiscount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
            {getTotalDiscount() > 0 && (
              <TableRow>
                <TableCell className="font-medium text-green-600">Total Discount</TableCell>
                <TableCell className="text-right text-green-600">
                  -₹{getTotalDiscount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            )}
            <TableRow className="border-t-2">
              <TableCell className="font-bold text-lg">Total Amount</TableCell>
              <TableCell className="text-right font-bold text-lg text-primary">
                ₹{getTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="text-sm text-muted-foreground text-center mt-4">
          Total Items: {formData.items.length} | Total Quantity: {getTotalQuantity()}
        </div>
      </div>
    </div>
  );
};

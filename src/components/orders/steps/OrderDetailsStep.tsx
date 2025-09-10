import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, CreditCard, FileText, Package, Tag } from 'lucide-react';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import type { OrderFormData } from '@/services/orders/types';

interface OrderDetailsStepProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  updateFormData
}) => {
  const { data: priceTypes = [] } = usePriceTypes();

  const handlePriceTypeChange = (priceTypeId: string) => {
    updateFormData({ price_type_id: priceTypeId === 'default' ? undefined : priceTypeId });
  };

  const handlePaymentModeChange = (paymentMode: 'cash' | 'credit' | 'bank_transfer' | 'cheque') => {
    updateFormData({ payment_mode: paymentMode });
  };

  const handleExpectedDeliveryDateChange = (date: string) => {
    updateFormData({ expected_delivery_date: date });
  };

  const handleShipmentTimeChange = (time: string) => {
    updateFormData({ shipment_time: time });
  };

  const handleOrderRemarksChange = (remarks: string) => {
    updateFormData({ order_remarks: remarks });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Price Type and Delivery Details */}
      <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price-type">Price Type *</Label>
              <Select
                value={formData.price_type_id || 'default'}
                onValueChange={handlePriceTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default (Base MRP)</SelectItem>
                      {priceTypes.map((priceType) => (
                        <SelectItem key={priceType.id} value={priceType.id}>
                          {priceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This will determine the pricing structure for the order items
              </p>
            </div>

            <div>
              <Label htmlFor="payment-mode">Payment Mode *</Label>
              <Select
                value={formData.payment_mode}
                onValueChange={handlePaymentModeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How the customer will pay for this order
              </p>
            </div>
          </div>
      </div>

      {/* Delivery Schedule */}
      <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected-delivery-date">Expected Delivery Date</Label>
              <Input
                id="expected-delivery-date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => handleExpectedDeliveryDateChange(e.target.value)}
                min={today}
              />
              <p className="text-xs text-muted-foreground mt-1">
                When the customer expects to receive the order
              </p>
            </div>

            <div>
              <Label htmlFor="shipment-time">Preferred Shipment Time</Label>
              <Input
                id="shipment-time"
                type="time"
                value={formData.shipment_time}
                onChange={(e) => handleShipmentTimeChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Preferred time for shipment/delivery (optional)
              </p>
            </div>
          </div>

          {formData.expected_delivery_date && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Delivery Information</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Expected delivery: {new Date(formData.expected_delivery_date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {formData.shipment_time && ` at ${formData.shipment_time}`}
              </p>
            </div>
          )}
      </div>

      {/* Additional Information */}
      <div>
          <div>
            <Label htmlFor="order-remarks">Order Remarks</Label>
            <Textarea
              id="order-remarks"
              value={formData.order_remarks}
              onChange={(e) => handleOrderRemarksChange(e.target.value)}
              placeholder="Add any special instructions, notes, or remarks for this order..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Any special instructions or notes for this order
            </p>
          </div>
      </div>

      {/* Order Summary Preview */}
      <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Type:</span>
                <span className="font-medium">
                  {formData.price_type_id 
                    ? priceTypes.find(pt => pt.id === formData.price_type_id)?.name || 'Unknown'
                    : 'Default (Base MRP)'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Mode:</span>
                <span className="font-medium capitalize">{formData.payment_mode.replace('_', ' ')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Delivery:</span>
                <span className="font-medium">
                  {formData.expected_delivery_date ? 
                    new Date(formData.expected_delivery_date).toLocaleDateString('en-IN') : 
                    'Not set'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipment Time:</span>
                <span className="font-medium">
                  {formData.shipment_time || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {formData.order_remarks && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Remarks:</span>
                <p className="mt-1 text-sm">{formData.order_remarks}</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

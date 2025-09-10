import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateOrder, useUpdateOrder } from '@/hooks/orders/useOrders';
import { CustomerSelectionStep } from './steps/CustomerSelectionStep';
import { OrderDetailsStep } from './steps/OrderDetailsStep';
import { ItemsSelectionStep } from './steps/ItemsSelectionStep';
import { ReviewStep } from './steps/ReviewStep';
import type { Order, OrderFormData, CreateOrderData } from '@/services/orders/types';

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

const steps = [
  { id: 1, title: 'Customer & Addresses', description: 'Select customer and delivery details' },
  { id: 2, title: 'Order Details', description: 'Set order type, dates, and payment' },
  { id: 3, title: 'Items', description: 'Add products and set quantities' },
  { id: 4, title: 'Review', description: 'Review and confirm the order' },
];

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  open,
  onOpenChange,
  order
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: '',
    ship_to_address: {
      label: '',
      type: 'delivery',
      address: '',
      city: { id: '', name: '' },
      state: { id: '', name: '' },
      postal_code: ''
    },
    bill_to_address: {
      label: '',
      type: 'billing',
      address: '',
      city: { id: '', name: '' },
      state: { id: '', name: '' },
      postal_code: ''
    },
    price_type_id: undefined,
    expected_delivery_date: '',
    shipment_time: '',
    payment_mode: 'cash',
    order_remarks: '',
    items: []
  });

  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  // Initialize form data when editing an order
  useEffect(() => {
    if (order && open) {
      setFormData({
        customer_id: order.customer_id,
        ship_to_address: order.ship_to_address,
        bill_to_address: order.bill_to_address,
        price_type_id: order.price_type_id,
        expected_delivery_date: order.expected_delivery_date || '',
        shipment_time: order.shipment_time || '',
        payment_mode: order.payment_mode,
        order_remarks: order.order_remarks || '',
        items: order.order_items?.map(item => ({
          id: item.id,
          item_type: item.item_type,
          sku_id: item.sku_id,
          size_id: item.size_id,
          misc_name: item.misc_name,
          quantity: item.quantity,
          price_type_id: item.price_type_id,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          subtotal: item.subtotal,
          sku: item.sku,
          size: item.size,
          price_type: item.price_type
        })) || []
      });
    }
  }, [order, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({
        customer_id: '',
        ship_to_address: {
          label: '',
          type: 'delivery',
          address: '',
          city: { id: '', name: '' },
          state: { id: '', name: '' },
          postal_code: ''
        },
        bill_to_address: {
          label: '',
          type: 'billing',
          address: '',
          city: { id: '', name: '' },
          state: { id: '', name: '' },
          postal_code: ''
        },
        price_type_id: undefined,
        expected_delivery_date: '',
        shipment_time: '',
        payment_mode: 'cash',
        order_remarks: '',
        items: []
      });
    }
  }, [open]);

  const updateFormData = (data: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.customer_id && 
               formData.ship_to_address.address && 
               formData.ship_to_address.city.id &&
               formData.bill_to_address.address && 
               formData.bill_to_address.city.id;
      case 2:
        return formData.payment_mode; // Price type is optional, can be empty for base MRP
      case 3:
        return formData.items.length > 0 && 
               formData.items.every(item => item.quantity > 0 && item.unit_price > 0);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceedToNextStep()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const orderData: CreateOrderData = {
        customer_id: formData.customer_id,
        price_type_id: formData.price_type_id,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        shipment_time: formData.shipment_time || undefined,
        payment_mode: formData.payment_mode,
        order_remarks: formData.order_remarks || undefined,
        ship_to_address: formData.ship_to_address,
        bill_to_address: formData.bill_to_address,
        items: formData.items.map(item => ({
          item_type: item.item_type,
          sku_id: item.sku_id,
          size_id: item.size_id,
          misc_name: item.misc_name,
          quantity: item.quantity,
          price_type_id: item.price_type_id,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage
        }))
      };

      if (order) {
        await updateOrderMutation.mutateAsync({ id: order.id, data: orderData });
      } else {
        await createOrderMutation.mutateAsync(orderData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerSelectionStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <OrderDetailsStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return (
          <ItemsSelectionStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;
  const isSubmitting = createOrderMutation.isPending || updateOrderMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? 'Edit Order' : 'Create New Order'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center space-y-2 ${
                index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  index + 1 < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index + 1 === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {index + 1 < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === steps.length ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceedToNextStep() || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {order ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {order ? 'Update Order' : 'Create Order'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { OrdersList } from '@/components/orders/OrdersList';
import { CreateOrderModal } from '@/components/orders/CreateOrderModal';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useOrders } from '@/hooks/orders/useOrders';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { Order } from '@/services/orders/types';

const Orders: React.FC = () => {
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'readymade' | 'custom'>('readymade');
  const { data: orders = [] } = useOrders();

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowCreateOrderModal(true);
  };

  const handleModalClose = () => {
    setShowCreateOrderModal(false);
    setEditingOrder(null);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      return;
    }

    const headers = [
      // Order fields
      'Order Number',
      'Order Status',
      'Price Type',
      'Expected Delivery Date',
      'Shipment Time',
      'Payment Mode',
      'Order Remarks',
      'Subtotal',
      'Discount Amount',
      'Total Amount',
      'Order Created At',
      'Order Updated At',
      // Customer details
      'Customer Code',
      'Customer Company Name',
      'Customer Contact Person',
      'Customer Email',
      'Customer Phone',
      'Customer Type',
      'Customer GST',
      'Customer Price Type',
      // Ship To Address
      'Ship To Label',
      'Ship To Address',
      'Ship To City',
      'Ship To State',
      'Ship To Postal Code',
      'Ship To Type',
      // Bill To Address
      'Bill To Label',
      'Bill To Address',
      'Bill To City',
      'Bill To State',
      'Bill To Postal Code',
      'Bill To Type',
      // Order Item fields
      'Item Type',
      'SKU Code',
      'Class Name',
      'Style Name',
      'Brand Name',
      'Category Name',
      'Color Name',
      'Size Name',
      'Misc Name',
      'Item Quantity',
      'Item Unit Price',
      'Item Discount Percentage',
      'Item Discount Amount',
      'Item Subtotal',
      'Item GST Rate',
      'Item GST Amount'
    ];

    // Create rows - one per order item (or one row if no items)
    const rows: string[][] = [];
    
    orders.forEach(order => {
      const orderRowBase = [
        `"${order.order_number || ''}"`,
        `"${order.status || ''}"`,
        `"${order.price_type?.name || ''}"`,
        `"${order.expected_delivery_date || ''}"`,
        `"${order.shipment_time || ''}"`,
        `"${order.payment_mode || ''}"`,
        `"${(order.order_remarks || '').replace(/"/g, '""')}"`,
        `"${order.subtotal || 0}"`,
        `"${order.discount_amount || 0}"`,
        `"${order.total_amount || 0}"`,
        `"${new Date(order.created_at).toISOString()}"`,
        `"${new Date(order.updated_at).toISOString()}"`,
        // Customer details
        `"${order.customer?.customer_code || ''}"`,
        `"${order.customer?.company_name || ''}"`,
        `"${order.customer?.contact_person || ''}"`,
        `"${order.customer?.email || ''}"`,
        `"${order.customer?.phone || ''}"`,
        `"${order.customer?.customer_type || ''}"`,
        `"${order.customer?.gst || ''}"`,
        `"${order.customer?.price_type?.name || ''}"`,
        // Ship To Address
        `"${order.ship_to_address?.label || ''}"`,
        `"${(order.ship_to_address?.address || '').replace(/"/g, '""')}"`,
        `"${order.ship_to_address?.city?.name || ''}"`,
        `"${order.ship_to_address?.state?.name || ''}"`,
        `"${order.ship_to_address?.postal_code || ''}"`,
        `"${order.ship_to_address?.type || ''}"`,
        // Bill To Address
        `"${order.bill_to_address?.label || ''}"`,
        `"${(order.bill_to_address?.address || '').replace(/"/g, '""')}"`,
        `"${order.bill_to_address?.city?.name || ''}"`,
        `"${order.bill_to_address?.state?.name || ''}"`,
        `"${order.bill_to_address?.postal_code || ''}"`,
        `"${order.bill_to_address?.type || ''}"`
      ];

      // If order has items, create one row per item
      if (order.order_items && order.order_items.length > 0) {
        order.order_items.forEach(item => {
          const itemRow = [
            ...orderRowBase,
            // Item fields
            `"${item.item_type || ''}"`,
            `"${item.sku?.sku_code || ''}"`,
            `"${item.sku?.class?.name || ''}"`,
            `"${item.sku?.class?.style?.name || ''}"`,
            `"${item.sku?.class?.style?.brand?.name || ''}"`,
            `"${item.sku?.class?.style?.category?.name || ''}"`,
            `"${item.sku?.class?.color?.name || ''}"`,
            `"${item.size?.name || ''}"`,
            `"${item.misc_name || ''}"`,
            `"${item.quantity || 0}"`,
            `"${item.unit_price || 0}"`,
            `"${item.discount_percentage || 0}"`,
            `"${item.discount_amount || 0}"`,
            `"${item.subtotal || 0}"`,
            `"${item.gst_rate || 0}"`,
            `"${item.gst_amount || 0}"`
          ];
          rows.push(itemRow);
        });
      } else {
        // If no items, create one row with empty item fields
        const emptyItemRow = [
          ...orderRowBase,
          `""`, // Item Type
          `""`, // SKU Code
          `""`, // Class Name
          `""`, // Style Name
          `""`, // Brand Name
          `""`, // Category Name
          `""`, // Color Name
          `""`, // Size Name
          `""`, // Misc Name
          `"0"`, // Item Quantity
          `"0"`, // Item Unit Price
          `"0"`, // Item Discount Percentage
          `"0"`, // Item Discount Amount
          `"0"`, // Item Subtotal
          `"0"`, // Item GST Rate
          `"0"`  // Item GST Amount
        ];
        rows.push(emptyItemRow);
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Orders"
        description="Manage customer orders and track their status"
        icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
        onAdd={() => setShowCreateOrderModal(true)}
        onExport={handleExport}
        onImport={() => setShowImportDialog(true)}
        canExport={!!orders?.length}
        showBackButton={false}
      />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'readymade' | 'custom')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="readymade">Readymade</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="readymade" className="mt-6">
          <OrdersList onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Custom orders functionality will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateOrderModal
        open={showCreateOrderModal}
        onOpenChange={handleModalClose}
        order={editingOrder}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        type="orders"
      />
    </div>
  );
};

export default Orders;
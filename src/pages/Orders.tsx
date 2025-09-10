import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { OrdersList } from '@/components/orders/OrdersList';
import { CreateOrderModal } from '@/components/orders/CreateOrderModal';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useOrders } from '@/hooks/orders/useOrders';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import type { Order } from '@/services/orders/types';

const Orders: React.FC = () => {
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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
      'Order Number',
      'Customer',
      'Order Type',
      'Status',
      'Total Amount',
      'Expected Delivery',
      'Payment Mode',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        `"${order.order_number}"`,
        `"${order.customer?.company_name || ''}"`,
        `"${order.order_type}"`,
        `"${order.status}"`,
        `"${order.total_amount}"`,
        `"${order.expected_delivery_date || ''}"`,
        `"${order.payment_mode}"`,
        new Date(order.created_at).toLocaleDateString()
      ].join(','))
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

      <OrdersList onEdit={handleEdit} />

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
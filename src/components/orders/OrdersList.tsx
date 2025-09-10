import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Filter, Eye } from 'lucide-react';
import { useOrders, useDeleteOrder } from '@/hooks/orders/useOrders';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { VirtualList } from '@/components/common';
import type { Order } from '@/services/orders/types';

interface OrdersListProps {
  onEdit?: (order: Order) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ onEdit }) => {
  const { data: orders, isLoading } = useOrders();
  const { data: priceTypes = [] } = usePriceTypes();
  const deleteOrderMutation = useDeleteOrder();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priceType: 'all',
    paymentMode: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleEdit = (order: Order) => {
    if (onEdit) {
      onEdit(order);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      await deleteOrderMutation.mutateAsync(id);
    }
  };


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priceType: 'all',
      paymentMode: 'all',
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const filteredOrders = orders?.filter(order => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.customer_code?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = filters.status === 'all' || 
      order.status === filters.status;

    // Order type filter
    const matchesPriceType = filters.priceType === 'all' || 
      (filters.priceType === 'default' && !order.price_type_id) ||
      order.price_type_id === filters.priceType;

    // Payment mode filter
    const matchesPaymentMode = filters.paymentMode === 'all' || 
      order.payment_mode === filters.paymentMode;

    return matchesSearch && matchesStatus && matchesPriceType && matchesPaymentMode;
  }) || [];

  // Sort orders by created_at
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Render order row for virtual list
  const renderOrderRow = (order: Order) => (
    <TableRow key={order.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{order.order_number}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{order.customer?.company_name}</div>
          <div className="text-sm text-muted-foreground">{order.customer?.customer_code}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {order.price_type?.name || 'Default (Base MRP)'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell>
        {order.expected_delivery_date ? 
          new Date(order.expected_delivery_date).toLocaleDateString('en-IN') : 
          '-'
        }
      </TableCell>
      <TableCell>
        <Badge variant="outline">{order.payment_mode}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(order)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(order.id)}
            disabled={deleteOrderMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return <div className="text-center">Loading orders...</div>;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchFilter
                placeholder="Search orders..."
                value={searchTerm}
                onChange={setSearchTerm}
                resultCount={sortedOrders.length}
                totalCount={orders?.length || 0}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Price Type
                  </label>
                  <Select
                    value={filters.priceType}
                    onValueChange={(value) => handleFilterChange('priceType', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Price Types</SelectItem>
                      <SelectItem value="default">Default (Base MRP)</SelectItem>
                      {priceTypes.map((priceType) => (
                        <SelectItem key={priceType.id} value={priceType.id}>
                          {priceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Payment Mode
                  </label>
                  <Select
                    value={filters.paymentMode}
                    onValueChange={(value) => handleFilterChange('paymentMode', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          {sortedOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Price Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Use virtual scrolling for large datasets */}
                {sortedOrders.length > 100 ? (
                  <VirtualList
                    items={sortedOrders}
                    height={600}
                    itemHeight={60}
                    renderItem={renderOrderRow}
                    className="w-full"
                  />
                ) : (
                  sortedOrders.map(renderOrderRow)
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No orders found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { OrdersList };

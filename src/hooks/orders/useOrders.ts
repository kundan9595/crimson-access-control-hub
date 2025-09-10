import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersService } from '@/services/orders/ordersService';
import type { Order, CreateOrderData } from '@/services/orders/types';

// Query keys
const ORDERS_QUERY_KEY = 'orders';

/**
 * Hook to fetch all orders
 */
export const useOrders = () => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY],
    queryFn: ordersService.getOrders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single order by ID
 */
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, id],
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new order
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderData) => ordersService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      toast.success('Order created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    },
  });
};

/**
 * Hook to update an existing order
 */
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOrderData> }) =>
      ordersService.updateOrder(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, id] });
      toast.success('Order updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    },
  });
};

/**
 * Hook to delete an order
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      toast.success('Order deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    },
  });
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order['status'] }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY, id] });
      toast.success('Order status updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    },
  });
};
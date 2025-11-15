import { supabase } from '@/integrations/supabase/client';
import type { Order, CreateOrderData, OrderItem } from './types';

class OrdersService {
  /**
   * Get all orders with customer and item details
   */
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(
            id,
            customer_code,
            company_name,
            contact_person,
            email,
            phone,
            customer_type,
            gst,
            price_type:price_types(
              id,
              name,
              category
            )
          ),
          price_type:price_types(
            id,
            name,
            category
          ),
          order_items(
            *,
            sku:skus(
              id,
              sku_code,
              description,
              base_mrp,
              cost_price,
              price_type_prices,
              class:classes(
                id,
                name,
                description,
                primary_image_url,
                gst_rate,
                style:styles(
                  id,
                  name,
                  brand:brands(id, name),
                  category:categories(id, name)
                ),
                color:colors(id, name, hex_code)
              ),
              size:sizes(id, name, code)
            ),
            size:sizes(id, name, code),
            price_type:price_types(id, name, category)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error;
    }
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(
            id,
            customer_code,
            company_name,
            contact_person,
            email,
            phone,
            customer_type,
            gst,
            price_type:price_types(
              id,
              name,
              category
            )
          ),
          order_items(
            *,
            sku:skus(
              id,
              sku_code,
              description,
              base_mrp,
              cost_price,
              price_type_prices,
              class:classes(
                id,
                name,
                description,
                primary_image_url,
                gst_rate,
                style:styles(
                  id,
                  name,
                  brand:brands(id, name),
                  category:categories(id, name)
                ),
                color:colors(id, name, hex_code)
              ),
              size:sizes(id, name, code)
            ),
            size:sizes(id, name, code),
            price_type:price_types(id, name, category)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Calculate totals including GST
      const subtotal = orderData.items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
        return sum + (itemSubtotal - discountAmount);
      }, 0);

      const totalGST = orderData.items.reduce((sum, item) => {
        return sum + (item.gst_amount || 0);
      }, 0);

      const totalAmount = subtotal + totalGST;

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        throw orderNumberError;
      }

      // Create the order
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumberData,
          customer_id: orderData.customer_id,
          price_type_id: orderData.price_type_id,
          expected_delivery_date: orderData.expected_delivery_date,
          shipment_time: orderData.shipment_time,
          payment_mode: orderData.payment_mode,
          order_remarks: orderData.order_remarks,
          ship_to_address: orderData.ship_to_address,
          bill_to_address: orderData.bill_to_address,
          subtotal: subtotal,
          discount_amount: orderData.items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unit_price;
            const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
            return sum + discountAmount;
          }, 0),
          total_amount: totalAmount,
          status: 'draft',
          created_by: user?.id
        }])
        .select('id')
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Create order items
      if (orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => {
          const itemSubtotal = item.quantity * item.unit_price;
          const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
          
          return {
            order_id: orderResult.id,
            item_type: item.item_type,
            sku_id: item.sku_id,
            size_id: item.size_id,
            misc_name: item.misc_name,
            quantity: item.quantity,
            price_type_id: item.price_type_id,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage || 0,
            discount_amount: discountAmount,
            subtotal: itemSubtotal - discountAmount,
            gst_rate: item.gst_rate || 0,
            gst_amount: item.gst_amount || 0
          };
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw itemsError;
        }
      }

      return orderResult.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Update an existing order
   */
  async updateOrder(id: string, orderData: Partial<CreateOrderData>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Calculate totals if items are provided
      let subtotal = 0;
      let totalGST = 0;
      let totalAmount = 0;
      if (orderData.items) {
        subtotal = orderData.items.reduce((sum, item) => {
          const itemSubtotal = item.quantity * item.unit_price;
          const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
          return sum + (itemSubtotal - discountAmount);
        }, 0);
        totalGST = orderData.items.reduce((sum, item) => {
          return sum + (item.gst_amount || 0);
        }, 0);
        totalAmount = subtotal + totalGST;
      }

      // Update the order
      const updateData: any = {
        updated_by: user?.id
      };

      if (orderData.customer_id) updateData.customer_id = orderData.customer_id;
      if (orderData.expected_delivery_date !== undefined) updateData.expected_delivery_date = orderData.expected_delivery_date;
      if (orderData.shipment_time !== undefined) updateData.shipment_time = orderData.shipment_time;
      if (orderData.payment_mode) updateData.payment_mode = orderData.payment_mode;
      if (orderData.order_remarks !== undefined) updateData.order_remarks = orderData.order_remarks;
      if (orderData.ship_to_address) updateData.ship_to_address = orderData.ship_to_address;
      if (orderData.bill_to_address) updateData.bill_to_address = orderData.bill_to_address;
      
      if (orderData.items) {
        updateData.subtotal = subtotal;
        updateData.discount_amount = orderData.items.reduce((sum, item) => {
          const itemSubtotal = item.quantity * item.unit_price;
          const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
          return sum + discountAmount;
        }, 0);
        updateData.total_amount = totalAmount;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (orderError) {
        console.error('Error updating order:', orderError);
        throw orderError;
      }

      // Update order items if provided
      if (orderData.items) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', id);

        if (deleteError) {
          console.error('Error deleting old order items:', deleteError);
          throw deleteError;
        }

        // Insert new items
        if (orderData.items.length > 0) {
          const orderItems = orderData.items.map(item => {
            const itemSubtotal = item.quantity * item.unit_price;
            const discountAmount = item.discount_percentage ? (itemSubtotal * item.discount_percentage / 100) : 0;
            
            return {
              order_id: id,
              item_type: item.item_type,
              sku_id: item.sku_id,
              size_id: item.size_id,
              misc_name: item.misc_name,
              quantity: item.quantity,
              price_type_id: item.price_type_id,
              unit_price: item.unit_price,
              discount_percentage: item.discount_percentage || 0,
              discount_amount: discountAmount,
              subtotal: itemSubtotal - discountAmount,
              gst_rate: item.gst_rate || 0,
              gst_amount: item.gst_amount || 0
            };
          });

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Error creating new order items:', itemsError);
            throw itemsError;
          }
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  /**
   * Delete an order
   */
  async deleteOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting order:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_by: user?.id
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

export const ordersService = new OrdersService();
export default ordersService;
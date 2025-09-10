import { supabase } from '@/integrations/supabase/client';
import { Customer, CustomerAddress } from './types';

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      addresses:customer_addresses(
        *,
        city:indian_cities(*),
        state:indian_states(*)
      ),
      price_type:price_types(*),
      orders(
        id,
        total_amount,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Calculate orders count and lifetime value for each customer
  const customersWithStats = (data || []).map((customer: any) => {
    const orders = customer.orders || [];
    const ordersCount = orders.length;
    const lifetimeValue = orders
      .filter((order: any) => order.status !== 'cancelled')
      .reduce((sum: number, order: any) => sum + (parseFloat(order.total_amount) || 0), 0);
    
    // Remove orders array from the final object as we don't need it in the UI
    const { orders: _, ...customerData } = customer;
    
    return {
      ...customerData,
      orders_count: ordersCount,
      lifetime_value: lifetimeValue
    };
  });

  return customersWithStats as Customer[];
};

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
  const { addresses, ...customerFields } = customerData;
  
  const insertData = {
    customer_code: customerFields.customer_code,
    company_name: customerFields.company_name,
    contact_person: customerFields.contact_person,
    email: customerFields.email,
    phone: customerFields.phone,
    status: customerFields.status,
    credit_limit: customerFields.credit_limit,
    payment_terms: customerFields.payment_terms,
    gst: customerFields.gst,
    notes: customerFields.notes,
    avatar_url: customerFields.avatar_url,
    price_type_id: customerFields.price_type_id,
  };

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([insertData])
    .select('*')
    .single();

  if (customerError) throw customerError;

  // Create addresses if provided
  if (addresses && addresses.length > 0) {
    const addressData = addresses.map(addr => ({
      customer_id: customer.id,
      label: addr.label,
      type: addr.type,
      address: addr.address,
      city_id: addr.city_id,
      state_id: addr.state_id,
      postal_code: addr.postal_code,
      is_primary: addr.is_primary,
    }));

    const { error: addressError } = await supabase
      .from('customer_addresses')
      .insert(addressData);

    if (addressError) throw addressError;
  }

  // Fetch the complete customer with addresses
  return fetchCustomerById(customer.id);
};

export const fetchCustomerById = async (id: string): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      addresses:customer_addresses(
        *,
        city:indian_cities(*),
        state:indian_states(*)
      ),
      price_type:price_types(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Customer;
};

export const updateCustomer = async ({ id, updates }: { id: string; updates: Partial<Customer> }): Promise<Customer> => {
  const { addresses, ...customerFields } = updates;
  
  // Update customer fields
  const { error: customerError } = await supabase
    .from('customers')
    .update(customerFields)
    .eq('id', id);

  if (customerError) throw customerError;

  // Update addresses if provided
  if (addresses) {
    // Delete existing addresses
    const { error: deleteError } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('customer_id', id);

    if (deleteError) throw deleteError;

    // Insert new addresses
    if (addresses.length > 0) {
      const addressData = addresses.map(addr => ({
        customer_id: id,
        label: addr.label,
        type: addr.type,
        address: addr.address,
        city_id: addr.city_id,
        state_id: addr.state_id,
        postal_code: addr.postal_code,
        is_primary: addr.is_primary,
      }));

      const { error: addressError } = await supabase
        .from('customer_addresses')
        .insert(addressData);

      if (addressError) throw addressError;
    }
  }

  // Fetch the complete customer with addresses
  return fetchCustomerById(id);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getCustomerByCode = async (customerCode: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_code', customerCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows returned
    throw error;
  }
  return data as Customer;
};

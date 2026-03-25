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
      price_type_id,
      zone:zones(*),
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

export const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { brand_ids?: string[]; distributor_ids?: string[] }): Promise<Customer> => {
  const { addresses, brand_ids, distributor_ids, is_owner_distributor, ...customerFields } = customerData;

  // Explicitly exclude is_owner_distributor from inserts - this field should only be modified directly in the database
  // For distributors, price_type_id should always be null (price types are created separately for each distributor)
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
    // Distributors don't have price_type_id - price types are created separately for each distributor
    // Retail customers don't have price_type_id anymore - they connect to distributors instead
    price_type_id: null, // Deprecated - always null now
    customer_type: customerFields.customer_type,
    zone_id: customerFields.zone_id,
    brand_ids: brand_ids || [],
    distributor_ids: distributor_ids || [], // For retail customers to connect to distributors
  };

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([insertData])
    .select('*')
    .single();

  if (customerError) {
    // Provide more specific error messages
    if (customerError.code === '23505') { // Unique violation
      if (customerError.message.includes('customer_code')) {
        throw new Error(`Customer code "${insertData.customer_code}" already exists. Please use a unique customer code.`);
      }
      throw new Error(`A customer with this information already exists: ${customerError.message}`);
    }
    if (customerError.code === '23503') { // Foreign key violation
      if (customerError.message.includes('price_type_id')) {
        throw new Error('The selected price type does not exist or is not available for this distributor.');
      }
      if (customerError.message.includes('zone_id')) {
        throw new Error('The selected zone does not exist.');
      }
      throw new Error(`Invalid reference: ${customerError.message}`);
    }
    // Check for brand uniqueness constraint violation
    if (customerError.message && customerError.message.includes('cannot share brands')) {
      throw new Error(customerError.message);
    }
    console.error('Error creating customer:', customerError);
    throw customerError;
  }

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
      price_type_id,
      zone:zones(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  
  // Fetch price type separately to avoid relationship ambiguity
  // (There are two relationships: customers.price_type_id -> price_types.id and price_types.distributor_id -> customers.id)
  let priceType = undefined;
  if (data.price_type_id) {
    const { data: priceTypeData } = await supabase
      .from('price_types')
      .select('id, name')
      .eq('id', data.price_type_id)
      .single();
    if (priceTypeData) {
      priceType = priceTypeData;
    }
  }
  
  return {
    ...data,
    price_type: priceType,
  } as Customer;
};

export const updateCustomer = async ({ id, updates }: { id: string; updates: Partial<Customer> & { brand_ids?: string[]; distributor_ids?: string[] } }): Promise<Customer> => {
  const { addresses, is_owner_distributor, distributor_ids, ...customerFields } = updates;

  // Explicitly exclude is_owner_distributor from updates - this field should only be modified directly in the database
  // Price_type_id is deprecated - always set to null
  customerFields.price_type_id = null;
  
  // For distributors, ensure distributor_ids is empty (only retail customers can have distributors)
  if (customerFields.customer_type === 'distributor') {
    customerFields.distributor_ids = [];
  } else {
    // For retail customers, include distributor_ids if provided
    customerFields.distributor_ids = distributor_ids || [];
  }
  
  // Update customer fields (including brand_ids and distributor_ids if provided)
  const { error: customerError } = await supabase
    .from('customers')
    .update(customerFields)
    .eq('id', id);

  if (customerError) {
    // Check for brand uniqueness constraint violation
    if (customerError.message && customerError.message.includes('cannot share brands')) {
      throw new Error(customerError.message);
    }
    // Provide more specific error messages
    if (customerError.code === '23505') { // Unique violation
      if (customerError.message.includes('customer_code')) {
        throw new Error(`Customer code already exists. Please use a unique customer code.`);
      }
      throw new Error(`A customer with this information already exists: ${customerError.message}`);
    }
    if (customerError.code === '23503') { // Foreign key violation
      if (customerError.message.includes('price_type_id')) {
        throw new Error('The selected price type does not exist or is not available for this distributor.');
      }
      if (customerError.message.includes('zone_id')) {
        throw new Error('The selected zone does not exist.');
      }
      throw new Error(`Invalid reference: ${customerError.message}`);
    }
    throw customerError;
  }

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
  // First check if this is an owner distributor - prevent deletion
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('is_owner_distributor, customer_type')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  if (customer?.is_owner_distributor && customer?.customer_type === 'distributor') {
    throw new Error('Cannot delete the owner distributor. Please set another distributor as owner first.');
  }

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

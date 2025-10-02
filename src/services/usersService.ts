import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

export async function fetchUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchWarehouseAdmins(): Promise<Profile[]> {
  try {
    // Use a direct SQL query to bypass RLS issues
    const { data, error } = await supabase
      .rpc('get_warehouse_admins');

    if (error) {
      console.error('Error fetching warehouse admins via RPC:', error);
      throw error;
    }

    // Found warehouse admins via RPC
    return data || [];
  } catch (error) {
    console.error('Error in fetchWarehouseAdmins:', error);
    throw error;
  }
}


export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createUser(data: any): Promise<any> {
  const { data: result, error } = await supabase.functions.invoke('create-user', {
    body: data,
  });
  if (error) throw new Error(error.message || 'Failed to create user');
  if (result?.error) throw new Error(result.error);
  return result;
} 
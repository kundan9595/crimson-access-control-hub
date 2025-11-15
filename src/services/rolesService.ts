import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Role = Tables<'roles'>;

export async function fetchRoles(): Promise<Role[]> {
  console.log('📡 [rolesService] Starting to fetch roles...');
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ [rolesService] Error fetching roles:', error);
    throw error;
  }
  
  console.log('✅ [rolesService] Successfully fetched roles:', {
    count: data?.length || 0,
    roles: data
  });
  
  return data || [];
}

export async function updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
  // First, fetch the role to check if it's protected
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Protected roles that cannot be edited
  const protectedRoles = ['Super Admin', 'Warehouse Admin', 'User'];
  if (role && protectedRoles.includes(role.name)) {
    throw new Error(`${role.name} is a protected role and cannot be edited.`);
  }
  
  // Proceed with update
  const { data, error } = await supabase
    .from('roles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', roleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createRole(data: Partial<Role>): Promise<Role> {
  const { data: result, error } = await supabase
    .from('roles')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteRole(roleId: string): Promise<void> {
  console.log('🗑️ [rolesService] Starting to delete role:', roleId);
  
  // First, fetch the role to check if it's protected
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();
  
  if (fetchError) {
    console.error('❌ [rolesService] Error fetching role:', fetchError);
    throw fetchError;
  }
  
  console.log('🔍 [rolesService] Role to delete:', role);
  
  // Protected roles that cannot be deleted
  const protectedRoles = ['Super Admin', 'Warehouse Admin', 'User'];
  if (role && protectedRoles.includes(role.name)) {
    console.error('❌ [rolesService] Attempted to delete protected role:', role.name);
    throw new Error(`${role.name} is a protected role and cannot be deleted.`);
  }
  
  // Proceed with deletion
  console.log('🗑️ [rolesService] Proceeding with deletion...');
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId);
  
  if (error) {
    console.error('❌ [rolesService] Error deleting role:', error);
    throw error;
  }
  
  console.log('✅ [rolesService] Role deleted successfully');
}


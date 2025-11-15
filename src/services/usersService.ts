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
  // Clean up the data - convert empty strings to null/undefined for optional fields
  const cleanedData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber || null,
    department: data.department || null,
    designation: data.designation || null,
    selectedRoles: data.selectedRoles || [],
  };

  const { data: result, error } = await supabase.functions.invoke('create-user', {
    body: cleanedData,
  });
  
  if (error) {
    console.error('Create user error:', error);
    throw new Error(error.message || 'Failed to create user');
  }
  
  if (result?.error) {
    console.error('Create user result error:', result.error);
    throw new Error(result.error);
  }
  
  return result;
}

export async function deleteUser(userId: string): Promise<void> {
  const { data: result, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });
  if (error) throw new Error(error.message || 'Failed to delete user');
  if (result?.error) throw new Error(result.error);
}

export async function resetUserPassword(userId: string, email?: string): Promise<void> {
  // Only include email in body if it's provided
  const body: { userId: string; email?: string } = { userId };
  if (email) {
    body.email = email;
  }
  
  console.log('🔐 [resetUserPassword] Calling reset-password with:', { userId, hasEmail: !!email, email: email || 'not provided' });
  
  const response = await supabase.functions.invoke('reset-password', {
    body,
  });
  
  const { data: result, error } = response;
  
  // Log raw response first
  console.log('🔐 [resetUserPassword] Raw Supabase Response:', {
    data: result,
    error: error,
    dataType: typeof result,
    dataString: typeof result === 'string' ? result : JSON.stringify(result),
    responseKeys: result ? Object.keys(result) : []
  });
  
  // Parse result if it's a string
  let parsedResult = result;
  if (typeof result === 'string') {
    try {
      parsedResult = JSON.parse(result);
      console.log('🔐 [resetUserPassword] ✅ Parsed string result to object');
    } catch (e) {
      console.warn('🔐 [resetUserPassword] ❌ Failed to parse result string:', e);
    }
  }
  
  // Log the full result object expanded
  console.log('🔐 [resetUserPassword] Full Response Object:', parsedResult);
  console.log('🔐 [resetUserPassword] Response Details:', { 
    resultType: typeof result,
    parsedType: typeof parsedResult,
    resultKeys: parsedResult ? Object.keys(parsedResult) : [],
    resultMessage: parsedResult?.message,
    resultDebug: parsedResult?.debug,
    hasDebug: !!parsedResult?.debug,
    fullResultString: JSON.stringify(parsedResult, null, 2)
  });
  
  // Log debug info if available
  if (parsedResult?.debug) {
    console.log('🔐 [resetUserPassword] ✅ Debug Info Found:', parsedResult.debug);
  } else {
    console.warn('🔐 [resetUserPassword] ⚠️ No debug info in response - edge function may not be returning it');
  }
  
  if (error) {
    console.error('Reset password error:', error);
    // Try to extract error message from error object
    const errorMessage = error.message || (error as any)?.error || 'Failed to reset password';
    throw new Error(errorMessage);
  }
  
  if (result?.error) {
    console.error('Reset password result error:', result.error);
    const errorMessage = typeof result.error === 'string' 
      ? result.error 
      : result.error?.message || result.error?.error || 'Failed to reset password';
    throw new Error(errorMessage);
  }
}

export async function fetchUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);
  if (error) throw error;
  return data?.map(ur => ur.role_id) || [];
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<void> {
  // Get current user for assigned_by
  const { data: currentUser } = await supabase.auth.getUser();
  const assignedBy = currentUser?.user?.id;

  // Delete all existing roles for this user
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) throw deleteError;

  // Insert new roles if any
  if (roleIds.length > 0) {
    const userRoles = roleIds.map(roleId => ({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy || null,
    }));

    const { error: insertError } = await supabase
      .from('user_roles')
      .insert(userRoles);
    
    if (insertError) throw insertError;
  }
} 
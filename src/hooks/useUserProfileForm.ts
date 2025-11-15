import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { updateUserProfile, fetchUserRoles, updateUserRoles } from '@/services/usersService';

type Profile = Tables<'profiles'>;

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department: string;
  designation: string;
  selectedRoles: string[];
};

export function useUserProfileForm(user: Profile, onSuccess: () => void) {
  const [formData, setFormData] = useState<FormData>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    department: user.department || '',
    designation: user.designation || '',
    selectedRoles: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's current roles when component mounts or user changes
  useEffect(() => {
    const loadUserRoles = async () => {
      try {
        const roleIds = await fetchUserRoles(user.id);
        setFormData(prev => ({ ...prev, selectedRoles: roleIds }));
      } catch (error) {
        console.error('Error fetching user roles:', error);
      }
    };
    loadUserRoles();
  }, [user.id]);

  const updateUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      // Update profile first
      await updateUserProfile(user.id, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number,
        department: userData.department,
        designation: userData.designation,
      } as Partial<Profile>);
      
      // Update user roles
      await updateUserRoles(user.id, userData.selectedRoles);
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User profile and roles updated successfully',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user profile',
        variant: 'destructive',
      });
    },
  });

  return {
    formData,
    setFormData,
    updateUser: updateUserMutation.mutate,
    isLoading: updateUserMutation.isPending,
    error: updateUserMutation.error,
  };
} 
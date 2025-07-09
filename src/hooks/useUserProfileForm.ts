import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { updateUserProfile } from '@/services/usersService';

type Profile = Tables<'profiles'>;

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department: string;
  designation: string;
};

export function useUserProfileForm(user: Profile, onSuccess: () => void) {
  const [formData, setFormData] = useState<FormData>({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone_number: user.phone_number || '',
    department: user.department || '',
    designation: user.designation || '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (userData: FormData) => {
      return updateUserProfile(user.id, userData as Partial<Profile>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User profile updated successfully',
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
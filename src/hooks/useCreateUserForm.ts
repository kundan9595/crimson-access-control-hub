import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { createUser } from '@/services/usersService';

type Role = Tables<'roles'>;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  designation: string;
};

export function useCreateUserForm(onSuccess: () => void) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: FormData & { selectedRoles: string[] }) => {
      return createUser({ ...userData, selectedRoles: userData.selectedRoles });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User created successfully. They will receive an email to set up their account.',
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        department: '',
        designation: '',
      });
      setSelectedRoles([]);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  return {
    formData,
    setFormData,
    selectedRoles,
    setSelectedRoles,
    createUser: createUserMutation.mutate,
    isLoading: createUserMutation.isPending,
    error: createUserMutation.error,
  };
} 
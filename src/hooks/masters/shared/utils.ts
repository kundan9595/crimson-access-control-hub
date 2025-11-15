
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface CreateMutationConfig<T = any> {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (data: T) => Promise<any>;
}

export interface UpdateMutationConfig<T = any> {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (params: { id: string; updates: Partial<T> }) => Promise<any>;
}

export interface DeleteMutationConfig {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (id: string) => Promise<any>;
}

export const useCreateMutation = <T = any>({
  queryKey,
  successMessage,
  errorMessage,
  mutationFn,
}: CreateMutationConfig<T>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      // Invalidate and refetch the query
      await queryClient.invalidateQueries({ queryKey });
      
      // Force a refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey });
      
      console.log('Cache invalidated for queryKey:', queryKey);
      
      toast({
        title: "Success",
        description: successMessage,
      });
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMutation = <T = any>({
  queryKey,
  successMessage,
  errorMessage,
  mutationFn,
}: UpdateMutationConfig<T>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      // Invalidate and refetch the query
      await queryClient.invalidateQueries({ queryKey });
      
      // Force a refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey });
      
      console.log('Cache invalidated for queryKey:', queryKey);
      
      toast({
        title: "Success",
        description: successMessage,
      });
    },
    onError: (error: any) => {
      console.error('Update mutation error:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMutation = ({
  queryKey,
  successMessage,
  errorMessage,
  mutationFn,
}: DeleteMutationConfig) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      // Invalidate and refetch the query
      await queryClient.invalidateQueries({ queryKey });
      
      // Force a refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey });
      
      console.log('Cache invalidated for queryKey:', queryKey);
      
      toast({
        title: "Success",
        description: successMessage,
      });
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      // Use the error message if it's a custom message, otherwise use the default errorMessage
      const displayMessage = error?.message && error.message !== errorMessage 
        ? error.message 
        : errorMessage;
      toast({
        title: "Error",
        description: displayMessage,
        variant: "destructive",
      });
    },
  });
};

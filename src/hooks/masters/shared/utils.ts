
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/** One-line dev log so expected API validation does not spam console.error + stack traces. */
function logMutationFailure(context: string, error: unknown, fallback: string): void {
  if (!import.meta.env.DEV) return;
  const msg = errorDescription(error, fallback);
  console.info(`[masters mutation] ${context}:`, msg);
}

function errorDescription(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    String((error as { message: string }).message).trim() !== ''
  ) {
    return String((error as { message: string }).message);
  }
  return fallback;
}

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
    onError: (error: unknown) => {
      logMutationFailure('create failed', error, errorMessage);
      toast({
        title: 'Error',
        description: errorDescription(error, errorMessage),
        variant: 'destructive',
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
    onError: (error: unknown) => {
      logMutationFailure('update failed', error, errorMessage);
      toast({
        title: 'Error',
        description: errorDescription(error, errorMessage),
        variant: 'destructive',
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
    onError: (error: unknown) => {
      logMutationFailure('delete failed', error, errorMessage);
      toast({
        title: 'Error',
        description: errorDescription(error, errorMessage),
        variant: 'destructive',
      });
    },
  });
};

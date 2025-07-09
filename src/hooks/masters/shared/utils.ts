
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export type MutationConfig<T> = {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (data: T) => Promise<any>;
};

export type UpdateMutationConfig<T> = {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (params: { id: string; updates: Partial<T> }) => Promise<any>;
};

export const useCreateMutation = <T>(config: MutationConfig<T>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      toast({
        title: "Success",
        description: config.successMessage,
      });
    },
    onError: (error) => {
      console.error(`Error in ${config.queryKey[0]}:`, error);
      toast({
        title: "Error",
        description: config.errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMutation = <T>(config: UpdateMutationConfig<T>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      toast({
        title: "Success",
        description: config.successMessage,
      });
    },
    onError: (error) => {
      console.error(`Error in ${config.queryKey[0]}:`, error);
      toast({
        title: "Error",
        description: config.errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMutation = (config: MutationConfig<string>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      toast({
        title: "Success",
        description: config.successMessage,
      });
    },
    onError: (error) => {
      console.error(`Error in ${config.queryKey[0]}:`, error);
      toast({
        title: "Error",
        description: config.errorMessage,
        variant: "destructive",
      });
    },
  });
};

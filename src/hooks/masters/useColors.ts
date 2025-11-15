
import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { supabase } from '@/integrations/supabase/client';

export const useColors = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateColor = () => {
  return useCreateMutation({
    queryKey: ['colors'],
    successMessage: 'Color created successfully',
    errorMessage: 'Failed to create color',
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('colors')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
  });
};

export const useUpdateColor = () => {
  return useUpdateMutation({
    queryKey: ['colors'],
    successMessage: 'Color updated successfully',
    errorMessage: 'Failed to update color',
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('colors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteColor = () => {
  return useDeleteMutation({
    queryKey: ['colors'],
    successMessage: 'Color deleted successfully',
    errorMessage: 'Failed to delete color',
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);
      
      if (error) {
        // Check if it's a foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key constraint')) {
          throw new Error('Cannot delete color: It is being used by one or more classes. Please remove the color from all classes first.');
        }
        throw error;
      }
    },
  });
};

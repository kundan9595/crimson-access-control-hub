
import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { supabase } from '@/integrations/supabase/client';

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBrand = () => {
  return useCreateMutation({
    queryKey: ['brands'],
    successMessage: 'Brand created successfully',
    errorMessage: 'Failed to create brand',
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('brands')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
  });
};

export const useUpdateBrand = () => {
  return useUpdateMutation({
    queryKey: ['brands'],
    successMessage: 'Brand updated successfully',
    errorMessage: 'Failed to update brand',
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useDeleteBrand = () => {
  return useDeleteMutation({
    queryKey: ['brands'],
    successMessage: 'Brand deleted successfully',
    errorMessage: 'Failed to delete brand',
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
  });
};

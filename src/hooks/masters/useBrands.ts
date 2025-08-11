
import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { useQueryCache } from '@/hooks/common/useAdvancedCache';
import { supabase } from '@/integrations/supabase/client';

// Cache configuration for brands
const BRANDS_CACHE_CONFIG = {
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 100,
  enableVersioning: true,
  enableDependencies: true,
};

export const useBrands = () => {
  const cache = useQueryCache(BRANDS_CACHE_CONFIG);

  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      return cache.cacheQuery(
        'brands',
        async () => {
          const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('name');
          
          if (error) throw error;
          return data;
        },
        {
          ttl: 10 * 60 * 1000, // 10 minutes
          version: 'v1',
          dependencies: ['brands'],
        }
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useCreateBrand = () => {
  const cache = useQueryCache(BRANDS_CACHE_CONFIG);

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
      
      // Invalidate related cache entries
      cache.invalidateByDependency('brands');
      
      return result;
    },
  });
};

export const useUpdateBrand = () => {
  const cache = useQueryCache(BRANDS_CACHE_CONFIG);

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
      
      // Invalidate related cache entries
      cache.invalidateByDependency('brands');
      
      return data;
    },
  });
};

export const useDeleteBrand = () => {
  const cache = useQueryCache(BRANDS_CACHE_CONFIG);

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
      
      // Invalidate related cache entries
      cache.invalidateByDependency('brands');
    },
  });
};

// Hook for prefetching brands data
export const usePrefetchBrands = () => {
  const cache = useQueryCache(BRANDS_CACHE_CONFIG);

  const prefetchBrands = async () => {
    await cache.prefetch(
      'brands',
      async () => {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data;
      },
      {
        ttl: 10 * 60 * 1000,
        version: 'v1',
        dependencies: ['brands'],
      }
    );
  };

  return { prefetchBrands };
};

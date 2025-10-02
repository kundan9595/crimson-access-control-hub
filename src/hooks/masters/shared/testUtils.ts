// Test utilities for verifying cache invalidation in masters hooks
// Use these in development to ensure CRUD operations work properly

import { useQueryClient } from '@tanstack/react-query';

export const useCacheTestUtils = () => {
  const queryClient = useQueryClient();

  // Test if a query is cached
  const isQueryCached = (queryKey: string[]) => {
    const query = queryClient.getQueryData(queryKey);
    return query !== undefined;
  };

  // Get cached data for a query
  const getCachedData = (queryKey: string[]) => {
    return queryClient.getQueryData(queryKey);
  };

  // Force invalidate a specific query
  const forceInvalidate = async (queryKey: string[]) => {
    await queryClient.invalidateQueries({ queryKey });
    console.log('Force invalidated query:', queryKey);
  };

  // Force refetch a specific query
  const forceRefetch = async (queryKey: string[]) => {
    await queryClient.refetchQueries({ queryKey });
    console.log('Force refetched query:', queryKey);
  };

  // Get all cached queries (for debugging)
  const getAllCachedQueries = () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().map(query => ({
      queryKey: query.queryKey,
      state: query.state.status,
      data: query.state.data,
    }));
  };

  // Clear all cache (for testing)
  const clearAllCache = () => {
    queryClient.clear();
    console.log('Cleared all cache');
  };

  // Test cache invalidation for a specific entity
  const testCacheInvalidation = async (entityName: string) => {
    const queryKey = [entityName];
    console.log(`Testing cache invalidation for ${entityName}:`);
    console.log('Before invalidation:', getCachedData(queryKey));
    
    await forceInvalidate(queryKey);
    await forceRefetch(queryKey);
    
    console.log('After invalidation:', getCachedData(queryKey));
  };

  return {
    isQueryCached,
    getCachedData,
    forceInvalidate,
    forceRefetch,
    getAllCachedQueries,
    clearAllCache,
    testCacheInvalidation,
  };
};

// Hook for debugging cache issues
export const useCacheDebugger = () => {
  const queryClient = useQueryClient();

  const debugCache = () => {
    console.log('=== CACHE DEBUG INFO ===');
    console.log('All cached queries:', getAllCachedQueries());
    console.log('Query client state:', queryClient.getQueryCache().getAll());
    console.log('========================');
  };

  const getAllCachedQueries = () => {
    const cache = queryClient.getQueryCache();
    return cache.getAll().map(query => ({
      queryKey: query.queryKey,
      state: query.state.status,
      data: query.state.data,
    }));
  };

  return {
    debugCache,
    getAllCachedQueries,
  };
};

// Template for masters hooks - use this as a reference for creating new masters hooks
// This ensures consistency across all masters pages and proper cache invalidation

import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './utils';

// Replace 'Entity' with the actual entity name (e.g., 'Brand', 'Category', etc.)
// Replace 'entity' with the actual entity name in lowercase (e.g., 'brand', 'category', etc.)

// 1. Import the service functions
import { 
  fetchEntities, 
  createEntity, 
  updateEntity, 
  deleteEntity, 
  Entity 
} from '@/services/mastersService';

// 2. Create the main query hook
export const useEntities = () => {
  return useQuery({
    queryKey: ['entities'], // Replace 'entities' with the actual entity name
    queryFn: fetchEntities,
  });
};

// 3. Create the create mutation hook
export const useCreateEntity = () => {
  return useCreateMutation({
    queryKey: ['entities'], // Replace 'entities' with the actual entity name
    successMessage: "Entity created successfully", // Replace 'Entity' with the actual entity name
    errorMessage: "Failed to create entity", // Replace 'entity' with the actual entity name
    mutationFn: createEntity,
  });
};

// 4. Create the update mutation hook
export const useUpdateEntity = () => {
  return useUpdateMutation<Entity>({
    queryKey: ['entities'], // Replace 'entities' with the actual entity name
    successMessage: "Entity updated successfully", // Replace 'Entity' with the actual entity name
    errorMessage: "Failed to update entity", // Replace 'entity' with the actual entity name
    mutationFn: ({ id, updates }) => updateEntity(id, updates),
  });
};

// 5. Create the delete mutation hook
export const useDeleteEntity = () => {
  return useDeleteMutation({
    queryKey: ['entities'], // Replace 'entities' with the actual entity name
    successMessage: "Entity deleted successfully", // Replace 'Entity' with the actual entity name
    errorMessage: "Failed to delete entity", // Replace 'entity' with the actual entity name
    mutationFn: deleteEntity,
  });
};

// 6. Optional: Create a prefetch hook if needed
export const usePrefetchEntities = () => {
  const prefetchEntities = async () => {
    // This will be handled by React Query's prefetch functionality
    // You can use queryClient.prefetchQuery() in components if needed
    return fetchEntities();
  };

  return { prefetchEntities };
};

// Key principles for masters hooks:
// 1. Always use the service functions directly (no custom caching)
// 2. Use React Query's built-in caching and invalidation
// 3. Keep the same pattern across all masters hooks
// 4. Use descriptive success/error messages
// 5. Always include TypeScript types for better type safety

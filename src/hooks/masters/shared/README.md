# Masters Hooks Architecture Guide

## Overview
This guide ensures consistent and reliable cache invalidation across all masters pages in the application.

## Key Principles

### 1. **Use Service Functions Directly**
- Always import and use service functions from `@/services/mastersService`
- Never use direct Supabase calls in hooks
- Never use custom caching systems (like `useQueryCache`)

### 2. **Follow the Standard Pattern**
All masters hooks should follow this exact pattern:

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchEntities, createEntity, updateEntity, deleteEntity, Entity } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './utils';

export const useEntities = () => {
  return useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
  });
};

export const useCreateEntity = () => {
  return useCreateMutation({
    queryKey: ['entities'],
    successMessage: "Entity created successfully",
    errorMessage: "Failed to create entity",
    mutationFn: createEntity,
  });
};

export const useUpdateEntity = () => {
  return useUpdateMutation<Entity>({
    queryKey: ['entities'],
    successMessage: "Entity updated successfully",
    errorMessage: "Failed to update entity",
    mutationFn: ({ id, updates }) => updateEntity(id, updates),
  });
};

export const useDeleteEntity = () => {
  return useDeleteMutation({
    queryKey: ['entities'],
    successMessage: "Entity deleted successfully",
    errorMessage: "Failed to delete entity",
    mutationFn: deleteEntity,
  });
};
```

### 3. **Cache Invalidation Strategy**
The mutation utilities now include:
- **Automatic cache invalidation** after successful mutations
- **Forced refetch** to ensure fresh data
- **Console logging** for debugging
- **Proper error handling**

### 4. **Why This Approach Works**
- **Single Source of Truth**: React Query manages all caching
- **Automatic Invalidation**: Mutations automatically refresh the UI
- **Consistent Pattern**: All masters pages work the same way
- **Better Performance**: No dual-cache conflicts
- **Easier Debugging**: Clear console logs for cache operations

## Common Issues and Solutions

### Issue: "New data not showing after create/update/delete"
**Solution**: This is now fixed with the improved mutation utilities that include forced refetch.

### Issue: "Cache not invalidating properly"
**Solution**: The new utilities use both `invalidateQueries` and `refetchQueries` to ensure fresh data.

### Issue: "Inconsistent behavior across masters pages"
**Solution**: All masters hooks now follow the same pattern and use the same utilities.

## Testing Cache Invalidation

To test if cache invalidation is working:

1. Open the browser console
2. Create/update/delete an item
3. Look for the log: `Cache invalidated for queryKey: ['entities']`
4. Verify the UI updates immediately

## Migration Guide

If you have existing masters hooks that don't follow this pattern:

1. Remove any custom caching (`useQueryCache`, `useAdvancedCache`)
2. Remove direct Supabase calls
3. Import service functions from `@/services/mastersService`
4. Use the standard pattern above
5. Test the CRUD operations

## Best Practices

1. **Always use the template** in `template.ts` for new masters hooks
2. **Test CRUD operations** after creating new hooks
3. **Check console logs** for cache invalidation confirmation
4. **Keep the same naming convention** for query keys
5. **Use TypeScript types** for better type safety

## Troubleshooting

### Console shows "Cache invalidated" but UI doesn't update
- Check if the component is using the correct query key
- Verify the service function is working correctly
- Check for any errors in the network tab

### Multiple cache invalidations
- This is normal and expected
- The utilities use both `invalidateQueries` and `refetchQueries` for reliability

### Performance concerns
- React Query handles caching efficiently
- The forced refetch only happens after successful mutations
- Consider using `staleTime` for better performance if needed

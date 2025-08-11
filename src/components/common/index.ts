// Dialog components
export {
  BaseDialog,
  FormDialog,
  createFormDialog,
  createMasterDialog,
  createConfirmationDialog,
  type BaseDialogProps,
  type FormDialogProps,
  type DialogFactoryConfig
} from './dialogs/DialogFactory';

// Error boundary components
export {
  GlobalErrorBoundary,
  useErrorBoundary,
  withErrorBoundary
} from './ErrorBoundary/GlobalErrorBoundary';

// Performance monitoring
export {
  usePerformanceMonitoring,
  useDependencyMonitoring,
  useAsyncMonitoring,
  useGlobalPerformanceMonitoring,
  type PerformanceMetrics,
  type PerformanceMonitoringOptions,
  type PerformanceMonitoringResult,
  type GlobalPerformanceContext
} from '../../hooks/common/usePerformanceMonitoring';

// Virtual scrolling
export {
  VirtualList,
  VirtualListItem,
  SearchableVirtualList,
  useInfiniteScroll,
  type VirtualListProps,
  type SearchableVirtualListProps
} from './VirtualList/VirtualList';

// Advanced caching
export {
  useAdvancedCache,
  useQueryCache,
  useComputationCache,
  type CacheConfig,
  type CacheStats,
  type CacheEntry
} from '../../hooks/common/useAdvancedCache';

// Unified mutations
export {
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation,
  useBulkMutation,
  createEntityMutations,
  useBrandMutations,
  useCategoryMutations,
  useColorMutations,
  useSizeGroupMutations,
  useZoneMutations,
  useVendorMutations,
  useStyleMutations,
  useClassMutations,
  useSkuMutations,
  usePartMutations,
  useAddOnMutations,
  useBaseProductMutations,
  useWarehouseMutations,
  useInventoryMutations,
  type MutationConfig,
  type CreateMutationConfig,
  type UpdateMutationConfig,
  type DeleteMutationConfig,
  type BulkMutationConfig
} from '../../hooks/common/useUnifiedMutations';

// Export all brand hooks
export * from './useBrands';

// Export all category hooks
export * from './useCategories';

// Export all color hooks
export * from './useColors';

// Export all size hooks (includes both size groups and sizes)
export * from './useSizes';

// Export all zone hooks
export * from './useZones';

// Export all price type hooks
export * from './usePriceTypes';

// Export all vendor hooks
export * from './useVendors';

// Export all style hooks
export * from './useStyles';

// Export all class hooks
export * from './useClasses';

// Export all SKU hooks
export * from './useSkus';

// Export all media hooks
export * from './useMedia';

// Re-export types for convenience
export type {
  Brand,
  Category,
  Color,
  SizeGroup,
  Size,
  Zone,
  PriceType,
  Vendor,
  Style,
  Class,
  Sku,
} from '@/services/mastersService';

// Re-export media types
export type {
  MediaFolder,
  MediaItem,
} from '@/services/masters/mediaService';

export * from './useFabrics';

export * from './useAddOns';

export * from './useParts';

// Export state and city hooks
export * from './useStates';
export * from './useCities';
export * from './usePromotionalBanners';
export * from './usePromotionalAssets';

// Export profit margin hooks
export * from './useProfitMargins';

// Export base products hooks
export * from './useBaseProducts';

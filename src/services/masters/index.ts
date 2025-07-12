// Export all brand services
export * from './brandsService';

// Export all category services
export * from './categoriesService';

// Export all color services
export * from './colorsService';

// Export all size services (includes both size groups and sizes)
export * from './sizesService';

// Export all zone services
export * from './zonesService';

// Export all price type services
export * from './priceTypesService';

// Export all vendor services
export * from './vendorsService';

// Export all style services
export * from './stylesService';

// Export all class services
export * from './classesService';

// Export all SKU services
export * from './skusService';

// Export all media services
export * from './mediaService';

// Export all app assets services
export * from './appAssetsService';

// Export all profit margin services
export * from './profitMarginsService';

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
} from './types';

// Re-export media types
export type {
  MediaFolder,
  MediaItem,
} from './mediaService';

// Re-export app assets types
export type {
  AppAsset,
} from './appAssetsService';

export * from './fabricsService';
export * from './addOnsService';
export * from './partsService';

// Re-export profit margin types
export type {
  ProfitMargin,
  CreateProfitMarginData,
  UpdateProfitMarginData,
} from './profitMarginsService';

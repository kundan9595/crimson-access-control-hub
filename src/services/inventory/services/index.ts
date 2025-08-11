// Export all inventory services
export { warehouseInventoryService, WarehouseInventoryService } from './WarehouseInventoryService';
export { inventoryExportService, InventoryExportService } from './InventoryExportService';
export { globalInventoryService, GlobalInventoryService } from './GlobalInventoryService';
export { inventoryStatisticsService, InventoryStatisticsService } from './InventoryStatisticsService';

// Re-export types for convenience
export type {
  WarehouseInventory,
  WarehouseInventoryLocation,
  WarehouseInventoryReservation,
  AddInventoryRequest,
  UpdateInventoryRequest,
  InventorySearchParams,
  InventorySearchResult,
  InventoryStatistics,
  InventoryFilters,
  ClassInventoryView,
  StyleInventoryView,
  ClassInventorySearchResult,
  StyleInventorySearchResult,
  ClassInventoryStatistics,
  StyleInventoryStatistics
} from '../types';

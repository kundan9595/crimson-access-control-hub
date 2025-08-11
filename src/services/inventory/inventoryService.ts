// Main inventory service that delegates to specialized services
// This maintains backward compatibility while using the decomposed architecture

import { warehouseInventoryService } from './services/WarehouseInventoryService';
import { inventoryExportService } from './services/InventoryExportService';
import { globalInventoryService } from './services/GlobalInventoryService';
import { inventoryStatisticsService } from './services/InventoryStatisticsService';

// Re-export all types and methods for backward compatibility
export * from './types';

// Delegate all methods to the appropriate specialized services
class InventoryService {
  // Warehouse inventory operations
  getWarehouseInventory = warehouseInventoryService.getWarehouseInventory.bind(warehouseInventoryService);
  getInventoryById = warehouseInventoryService.getInventoryById.bind(warehouseInventoryService);
  addInventory = warehouseInventoryService.addInventory.bind(warehouseInventoryService);
  updateInventory = warehouseInventoryService.updateInventory.bind(warehouseInventoryService);
  deleteInventory = warehouseInventoryService.deleteInventory.bind(warehouseInventoryService);
  addReservation = warehouseInventoryService.addReservation.bind(warehouseInventoryService);
  updateReservationStatus = warehouseInventoryService.updateReservationStatus.bind(warehouseInventoryService);
  getInventoryByRack = warehouseInventoryService.getInventoryByRack.bind(warehouseInventoryService);
  getInventoryCountByRack = warehouseInventoryService.getInventoryCountByRack.bind(warehouseInventoryService);
  getInventoryQuantityByRack = warehouseInventoryService.getInventoryQuantityByRack.bind(warehouseInventoryService);

  // Statistics operations
  getInventoryStatistics = inventoryStatisticsService.getInventoryStatistics.bind(inventoryStatisticsService);
  getGlobalInventoryStatistics = inventoryStatisticsService.getGlobalInventoryStatistics.bind(inventoryStatisticsService);
  getGlobalClassInventoryStatistics = inventoryStatisticsService.getGlobalClassInventoryStatistics.bind(inventoryStatisticsService);
  getGlobalStyleInventoryStatistics = inventoryStatisticsService.getGlobalStyleInventoryStatistics.bind(inventoryStatisticsService);
  getConsolidatedSkuInventoryStatistics = inventoryStatisticsService.getConsolidatedSkuInventoryStatistics.bind(inventoryStatisticsService);

  // Export operations
  exportInventory = inventoryExportService.exportInventory.bind(inventoryExportService);
  exportGlobalInventory = inventoryExportService.exportGlobalInventory.bind(inventoryExportService);
  exportGlobalClassInventory = inventoryExportService.exportGlobalClassInventory.bind(inventoryExportService);
  exportGlobalStyleInventory = inventoryExportService.exportGlobalStyleInventory.bind(inventoryExportService);
  exportConsolidatedSkuInventory = inventoryExportService.exportConsolidatedSkuInventory.bind(inventoryExportService);

  // Global inventory operations
  getGlobalInventory = globalInventoryService.getGlobalInventory.bind(globalInventoryService);
  getGlobalClassInventory = globalInventoryService.getGlobalClassInventory.bind(globalInventoryService);
  getGlobalStyleInventory = globalInventoryService.getGlobalStyleInventory.bind(globalInventoryService);
  getConsolidatedSkuInventory = globalInventoryService.getConsolidatedSkuInventory.bind(globalInventoryService);
  getSkuLocationsByWarehouse = globalInventoryService.getSkuLocationsByWarehouse.bind(globalInventoryService);
  searchSkus = globalInventoryService.searchSkus.bind(globalInventoryService);
  getWarehouses = globalInventoryService.getWarehouses.bind(globalInventoryService);

  // Additional statistics methods
  getInventoryStatisticsByWarehouse = inventoryStatisticsService.getInventoryStatisticsByWarehouse.bind(inventoryStatisticsService);
  getInventoryStatisticsByBrand = inventoryStatisticsService.getInventoryStatisticsByBrand.bind(inventoryStatisticsService);
  getInventoryStatisticsByCategory = inventoryStatisticsService.getInventoryStatisticsByCategory.bind(inventoryStatisticsService);
  getInventoryStatisticsByStyle = inventoryStatisticsService.getInventoryStatisticsByStyle.bind(inventoryStatisticsService);
  getInventoryStatisticsByClass = inventoryStatisticsService.getInventoryStatisticsByClass.bind(inventoryStatisticsService);
  getInventoryStatisticsByColor = inventoryStatisticsService.getInventoryStatisticsByColor.bind(inventoryStatisticsService);
  getInventoryStatisticsBySize = inventoryStatisticsService.getInventoryStatisticsBySize.bind(inventoryStatisticsService);
}

// Create and export the singleton instance
export const inventoryService = new InventoryService();

// Also export the class for testing purposes
export { InventoryService }; 
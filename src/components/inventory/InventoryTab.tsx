import React from 'react';
import { useInventory } from '@/hooks/inventory/useInventory';
import InventoryTable from './InventoryTable';
import { inventoryService } from '@/services/inventory/inventoryService';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

interface InventoryTabProps {
  warehouseId: string;
  warehouseStructure: any;
}

const InventoryTab: React.FC<InventoryTabProps> = ({
  warehouseId,
  warehouseStructure
}) => {
  const {
    inventory,
    statistics,
    loading,
    error,
    pagination,
    searchInventory,
    clearSearch,
    loadMore
  } = useInventory({
    warehouseId,
    autoFetch: true
  });

  // Handle add inventory success
  const handleAddSuccess = () => {
    // The hook will automatically refresh the data
    toast.success('Inventory added successfully');
  };

  // Handle export inventory
  const handleExport = async () => {
    try {
      const exportData = await inventoryService.exportInventory(warehouseId);
      
      if (exportData.length === 0) {
        toast.error('No inventory data to export');
        return;
      }

      exportToCSV({
        filename: `inventory-export-${new Date().toISOString().split('T')[0]}.csv`,
        headers: [
          'SKU Code',
          'Brand',
          'Product Name',
          'Color',
          'Size',
          'Floor Name',
          'Lane Name',
          'Rack Name',
          'Quantity',
          'Total Quantity',
          'Reserved Quantity',
          'Available Quantity',
          'Created Date'
        ],
        data: exportData,
        fieldMap: {
          'SKU Code': 'sku_code',
          'Brand': 'brand',
          'Product Name': 'product_name',
          'Color': 'color',
          'Size': 'size',
          'Floor Name': 'floor_name',
          'Lane Name': 'lane_name',
          'Rack Name': 'rack_name',
          'Quantity': 'quantity',
          'Total Quantity': 'total_quantity',
          'Reserved Quantity': 'reserved_quantity',
          'Available Quantity': 'available_quantity',
          'Created Date': (item: any) => new Date(item.created_at).toLocaleDateString()
        }
      });

      toast.success(`Exported ${exportData.length} inventory records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory');
    }
  };

  // Handle bulk import success
  const handleBulkImportSuccess = () => {
    // Refresh the inventory data
    // The hook will automatically refresh the data
    toast.success('Bulk import completed successfully');
  };

  return (
    <InventoryTable
      inventory={inventory}
      statistics={statistics}
      loading={loading}
      error={error}
      pagination={pagination}
      onSearch={searchInventory}
      onClearSearch={clearSearch}
      onLoadMore={loadMore}
      onAddSuccess={handleAddSuccess}
      onBulkImportSuccess={handleBulkImportSuccess}
      onExport={handleExport}
      warehouseId={warehouseId}
      warehouseStructure={warehouseStructure}
      showWarehouseColumn={false}
      title="Inventory"
      showAddButton={true}
      showBulkImport={true}
      showExport={true}
    />
  );
};

export default InventoryTab; 
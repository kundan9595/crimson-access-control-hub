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
    loadMore,
    addInventory,
    fetchInventory
  } = useInventory({
    warehouseId,
    autoFetch: true
  });

  // Handle add inventory success
  const handleAddSuccess = async () => {
    try {
      // Refresh the inventory data
      await fetchInventory();
      toast.success('Inventory added successfully');
    } catch (error) {
      console.error('Error refreshing inventory:', error);
      toast.error('Inventory added but failed to refresh the list');
    }
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
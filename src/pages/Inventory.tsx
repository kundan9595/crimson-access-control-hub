import React from 'react';
import { useGlobalInventory } from '@/hooks/inventory/useGlobalInventory';
import InventoryTable from '@/components/inventory/InventoryTable';
import { inventoryService } from '@/services/inventory/inventoryService';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';

const Inventory: React.FC = () => {
  const {
    inventory,
    statistics,
    loading,
    error,
    pagination,
    searchInventory,
    clearSearch,
    loadMore,
    exportInventory
  } = useGlobalInventory({
    autoFetch: true
  });

  // Handle add inventory success (not applicable for global view)
  const handleAddSuccess = () => {
    // This is not applicable for global inventory view
    // Users should add inventory from specific warehouse pages
  };

  // Handle export global inventory
  const handleExport = async () => {
    try {
      const exportData = await exportInventory();
      
      if (exportData.length === 0) {
        toast.error('No inventory data to export');
        return;
      }

      exportToCSV({
        filename: `global-inventory-export-${new Date().toISOString().split('T')[0]}.csv`,
        headers: [
          'Warehouse',
          'Warehouse Location',
          'SKU Code',
          'Brand',
          'Product Name',
          'Color',
          'Size',
          'Total Quantity',
          'Reserved Quantity',
          'Available Quantity',
          'Created Date'
        ],
        data: exportData,
        fieldMap: {
          'Warehouse': 'warehouse_name',
          'Warehouse Location': 'warehouse_location',
          'SKU Code': 'sku_code',
          'Brand': 'brand',
          'Product Name': 'product_name',
          'Color': 'color',
          'Size': 'size',
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
    toast.success('Bulk import completed successfully');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Inventory</h1>
          <p className="text-gray-600 mt-2">
            View and manage inventory across all warehouses
          </p>
        </div>
      </div>

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
        showWarehouseColumn={true}
        title="Global Inventory"
        showAddButton={false} // Disable add button for global view
        showBulkImport={true}
        showExport={true}
      />
    </div>
  );
};

export default Inventory; 
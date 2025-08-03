import React, { useState, useEffect } from 'react';
import { useGlobalInventory } from '@/hooks/inventory/useGlobalInventory';
import { useClassInventory } from '@/hooks/inventory/useClassInventory';
import { useStyleInventory } from '@/hooks/inventory/useStyleInventory';
import InventoryTable from '@/components/inventory/InventoryTable';
import ClassInventoryTable from '@/components/inventory/ClassInventoryTable';
import StyleInventoryTable from '@/components/inventory/StyleInventoryTable';
import InventoryViewSelector from '@/components/inventory/InventoryViewSelector';
import { InventoryViewType } from '@/components/inventory/types';
import InventoryDrillDownModal from '@/components/inventory/InventoryDrillDownModal';
import { inventoryService } from '@/services/inventory/inventoryService';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import InventoryLocationsModal from '@/components/inventory/InventoryLocationsModal';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const Inventory: React.FC = () => {
  const [currentView, setCurrentView] = useState<InventoryViewType>('sku');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [drillDownModal, setDrillDownModal] = useState({
    isOpen: false,
    viewType: 'sku' as InventoryViewType,
    itemId: '',
    itemName: '',
    details: [] as any[]
  });

  const [locationsModal, setLocationsModal] = useState({
    isOpen: false,
    viewType: 'sku' as InventoryViewType,
    itemId: '',
    itemName: '',
    locations: [] as any[]
  });

  // SKU View Hook
  const skuInventory = useGlobalInventory({
    autoFetch: false // We'll manually control fetching
  });

  // Class View Hook
  const classInventory = useClassInventory({
    autoFetch: false // We'll manually control fetching
  });

  // Style View Hook
  const styleInventory = useStyleInventory({
    autoFetch: false // We'll manually control fetching
  });

  // Fetch data when view changes
  useEffect(() => {
    switch (currentView) {
      case 'sku':
        if (skuInventory.inventory.length === 0) {
          skuInventory.searchInventory('');
        }
        break;
      case 'class':
        if (classInventory.inventory.length === 0) {
          classInventory.searchInventory('');
        }
        break;
      case 'style':
        if (styleInventory.inventory.length === 0) {
          styleInventory.searchInventory('');
        }
        break;
    }
  }, [currentView, skuInventory, classInventory, styleInventory]);

  // Initial data fetch
  useEffect(() => {
    // Load SKU data by default
    skuInventory.searchInventory('');
  }, []); // Empty dependency array - only run once on mount

  // Get current view data
  const getCurrentViewData = () => {
    switch (currentView) {
      case 'sku':
        return {
          inventory: skuInventory.inventory,
          statistics: skuInventory.statistics,
          loading: skuInventory.loading,
          error: skuInventory.error,
          pagination: skuInventory.pagination,
          searchInventory: skuInventory.searchInventory,
          clearSearch: skuInventory.clearSearch,
          loadMore: skuInventory.loadMore,
          exportInventory: skuInventory.exportInventory
        };
      case 'class':
        return {
          inventory: classInventory.inventory,
          statistics: classInventory.statistics,
          loading: classInventory.loading,
          error: classInventory.error,
          pagination: classInventory.pagination,
          searchInventory: classInventory.searchInventory,
          clearSearch: classInventory.clearSearch,
          loadMore: classInventory.loadMore,
          exportInventory: classInventory.exportInventory
        };
      case 'style':
        return {
          inventory: styleInventory.inventory,
          statistics: styleInventory.statistics,
          loading: styleInventory.loading,
          error: styleInventory.error,
          pagination: styleInventory.pagination,
          searchInventory: styleInventory.searchInventory,
          clearSearch: styleInventory.clearSearch,
          loadMore: styleInventory.loadMore,
          exportInventory: styleInventory.exportInventory
        };
      default:
        return skuInventory;
    }
  };

  const currentData = getCurrentViewData();

  // Handle view change
  const handleViewChange = (view: InventoryViewType) => {
    setCurrentView(view);
  };

  // Handle add inventory success (not applicable for global view)
  const handleAddSuccess = () => {
    // This is not applicable for global inventory view
    // Users should add inventory from specific warehouse pages
  };

  // Handle export based on current view
  const handleExport = async () => {
    try {
      const exportData = await currentData.exportInventory();
      
      if (exportData.length === 0) {
        toast.error('No inventory data to export');
        return;
      }

      let filename: string;
      let headers: string[];

      switch (currentView) {
        case 'sku':
          filename = `global-sku-inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
          headers = [
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
          ];
          break;
        case 'class':
          filename = `global-class-inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
          headers = [
            'Class Name',
            'Style Name',
            'Brand',
            'Color',
            'Size Group',
            'Total Quantity',
            'Reserved Quantity',
            'Available Quantity',
            'SKU Count',
            'Warehouse Count',
            'Locations Count'
          ];
          break;
        case 'style':
          filename = `global-style-inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
          headers = [
            'Style Name',
            'Brand',
            'Category',
            'Total Quantity',
            'Reserved Quantity',
            'Available Quantity',
            'Class Count',
            'SKU Count',
            'Warehouse Count',
            'Locations Count'
          ];
          break;
        default:
          filename = `global-inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
          headers = [];
      }

      exportToCSV({
        filename,
        headers,
        data: exportData,
        fieldMap: {} // Use default field mapping
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

  // Handle view details (for drill-down functionality)
  const handleViewDetails = async (id: string) => {
    try {
      // Find the item details from current inventory
      const currentInventory = currentData.inventory;
      let item: any = null;
      let itemName = 'Unknown';

      // Type-safe way to find the item based on current view
      if (currentView === 'sku') {
        item = (currentInventory as any[]).find((inv: any) => inv.id === id);
        itemName = item?.sku?.sku_code || 'Unknown SKU';
      } else if (currentView === 'class') {
        item = (currentInventory as any[]).find((inv: any) => inv.class_id === id);
        itemName = item?.class_name || 'Unknown Class';
      } else if (currentView === 'style') {
        item = (currentInventory as any[]).find((inv: any) => inv.style_id === id);
        itemName = item?.style_name || 'Unknown Style';
      }

      if (!item) {
        toast.error('Item not found');
        return;
      }
      
      setDrillDownModal({
        isOpen: true,
        viewType: currentView,
        itemId: id,
        itemName,
        details: [] // Placeholder - would be populated with actual API call
      });

      toast.info(`Viewing details for ${itemName}`);
    } catch (error) {
      console.error('Error viewing details:', error);
      toast.error('Failed to load details');
    }
  };

  // Handle view locations
  const handleViewLocations = async (id: string) => {
    try {
      // Find the item details from current inventory
      const currentInventory = currentData.inventory;
      let item: any = null;
      let itemName = 'Unknown';

      // Type-safe way to find the item based on current view
      if (currentView === 'sku') {
        item = (currentInventory as any[]).find((inv: any) => inv.id === id);
        itemName = item?.sku?.sku_code || 'Unknown SKU';
      } else if (currentView === 'class') {
        item = (currentInventory as any[]).find((inv: any) => inv.class_id === id);
        itemName = item?.class_name || 'Unknown Class';
      } else if (currentView === 'style') {
        item = (currentInventory as any[]).find((inv: any) => inv.style_id === id);
        itemName = item?.style_name || 'Unknown Style';
      }

      if (!item) {
        toast.error('Item not found');
        return;
      }

      // For now, we'll show placeholder data. In a real implementation,
      // you would fetch location data from the API based on the view type
      const placeholderLocations = [
        {
          id: '1',
          warehouse_name: 'Main Warehouse',
          floor_name: 'Floor 1',
          lane_name: 'Lane A',
          rack_name: 'Rack 1 (Left)',
          quantity: 50,
          sku_code: item.sku_code || 'SKU001',
          size_name: item.size_name || 'M',
          class_name: item.class_name,
          style_name: item.style_name
        }
      ];
      
      setLocationsModal({
        isOpen: true,
        viewType: currentView,
        itemId: id,
        itemName,
        locations: placeholderLocations
      });

      toast.info(`Viewing locations for ${itemName}`);
    } catch (error) {
      console.error('Error viewing locations:', error);
      toast.error('Failed to load locations');
    }
  };

  // Close drill-down modal
  const closeDrillDownModal = () => {
    setDrillDownModal(prev => ({ ...prev, isOpen: false }));
  };

  // Close locations modal
  const closeLocationsModal = () => {
    setLocationsModal(prev => ({ ...prev, isOpen: false }));
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <InventoryViewSelector
        currentView={currentView}
        onViewChange={handleViewChange}
        loading={currentData.loading}
      />

      {/* Render appropriate table based on current view */}
      {currentView === 'sku' && (
        <InventoryTable
          inventory={currentData.inventory as any}
          statistics={currentData.statistics}
          loading={currentData.loading}
          error={currentData.error}
          pagination={currentData.pagination}
          onSearch={currentData.searchInventory}
          onClearSearch={currentData.clearSearch}
          onLoadMore={currentData.loadMore}
          onAddSuccess={handleAddSuccess}
          onBulkImportSuccess={handleBulkImportSuccess}
          onExport={handleExport}
          showWarehouseColumn={false}
          title="SKU Inventory"
          showAddButton={false} // Disable add button for global view
          showBulkImport={false} // Disable bulk import since it's at top level
          showExport={true}
        />
      )}

      {currentView === 'class' && (
        <ClassInventoryTable
          inventory={currentData.inventory as any}
          statistics={currentData.statistics}
          loading={currentData.loading}
          error={currentData.error}
          pagination={currentData.pagination}
          onSearch={currentData.searchInventory}
          onClearSearch={currentData.clearSearch}
          onLoadMore={currentData.loadMore}
          onExport={handleExport}
          onViewDetails={handleViewDetails}
          onViewLocations={handleViewLocations}
        />
      )}

      {currentView === 'style' && (
        <StyleInventoryTable
          inventory={currentData.inventory as any}
          statistics={currentData.statistics}
          loading={currentData.loading}
          error={currentData.error}
          pagination={currentData.pagination}
          onSearch={currentData.searchInventory}
          onClearSearch={currentData.clearSearch}
          onLoadMore={currentData.loadMore}
          onExport={handleExport}
          onViewDetails={handleViewDetails}
          onViewLocations={handleViewLocations}
        />
      )}

      {/* Drill-down Modal */}
      <InventoryDrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={closeDrillDownModal}
        viewType={drillDownModal.viewType}
        itemId={drillDownModal.itemId}
        itemName={drillDownModal.itemName}
        details={drillDownModal.details}
      />

      {/* Locations Modal */}
      <InventoryLocationsModal
        isOpen={locationsModal.isOpen}
        onClose={closeLocationsModal}
        viewType={locationsModal.viewType}
        itemId={locationsModal.itemId}
        itemName={locationsModal.itemName}
        locations={locationsModal.locations}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="inventory"
      />
    </div>
  );
};

export default Inventory; 
import React, { useState, useEffect, useRef } from 'react';
import { useConsolidatedSkuInventory } from '@/hooks/inventory/useConsolidatedSkuInventory';
import { useClassInventory } from '@/hooks/inventory/useClassInventory';
import { useStyleInventory } from '@/hooks/inventory/useStyleInventory';
import ConsolidatedSkuInventoryTable from '@/components/inventory/ConsolidatedSkuInventoryTable';
import ClassInventoryTable from '@/components/inventory/ClassInventoryTable';
import StyleInventoryTable from '@/components/inventory/StyleInventoryTable';
import InventoryViewSelector from '@/components/inventory/InventoryViewSelector';
import InventoryFilters, { InventoryFilterState } from '@/components/inventory/InventoryFilters';
import { InventoryViewType } from '@/components/inventory/types';
import InventoryDrillDownModal from '@/components/inventory/InventoryDrillDownModal';
import { inventoryService } from '@/services/inventory/inventoryService';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import EnhancedInventoryLocationsModal from '@/components/inventory/EnhancedInventoryLocationsModal';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const Inventory: React.FC = () => {
  const [currentView, setCurrentView] = useState<InventoryViewType>('sku');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [filters, setFilters] = useState<InventoryFilterState>({});
  const [hasError, setHasError] = useState(false);
  const initialFetchDone = useRef(false);
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
    itemCode: ''
  });

  // SKU View Hook
  const skuInventory = useConsolidatedSkuInventory({
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
        skuInventory.searchInventory('');
        skuInventory.fetchStatistics();
        break;
      case 'class':
        classInventory.searchInventory('');
        classInventory.fetchStatistics();
        break;
      case 'style':
        styleInventory.searchInventory('');
        styleInventory.fetchStatistics();
        break;
    }
  }, [currentView]);

  // Handle filter changes
  useEffect(() => {
    const hasFilters = Object.keys(filters).length > 0;
    
    switch (currentView) {
      case 'sku':
        if (hasFilters) {
          // Apply filters to consolidated SKU view
          skuInventory.filterInventory(filters);
        } else {
          // Clear filters and refresh data
          skuInventory.clearSearch();
        }
        break;
      case 'class':
        // For now, class view doesn't support complex filtering
        // Just refresh data when filters change
        classInventory.clearSearch();
        break;
      case 'style':
        // For now, style view doesn't support complex filtering
        // Just refresh data when filters change
        styleInventory.clearSearch();
        break;
    }
  }, [filters, currentView]);

  // Initial data fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      // Load SKU data by default
      skuInventory.searchInventory('');
      skuInventory.fetchStatistics();
      initialFetchDone.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  // Get current view data
  const getCurrentViewData = () => {
    switch (currentView) {
      case 'sku':
        return {
          inventory: skuInventory.inventory || [],
          statistics: skuInventory.statistics || null,
          loading: skuInventory.loading || false,
          error: skuInventory.error || null,
          pagination: skuInventory.pagination || { page: 1, total: 0, hasMore: false },
          searchInventory: skuInventory.searchInventory,
          clearSearch: skuInventory.clearSearch,
          loadMore: skuInventory.loadMore,
          exportInventory: skuInventory.exportInventory
        };
        
      case 'class':
        return {
          inventory: classInventory.inventory || [],
          statistics: classInventory.statistics || null,
          loading: classInventory.loading || false,
          error: classInventory.error || null,
          pagination: classInventory.pagination || { page: 1, total: 0, hasMore: false },
          searchInventory: classInventory.searchInventory,
          clearSearch: classInventory.clearSearch,
          loadMore: classInventory.loadMore,
          exportInventory: classInventory.exportInventory
        };
        
      case 'style':
        return {
          inventory: styleInventory.inventory || [],
          statistics: styleInventory.statistics || null,
          loading: styleInventory.loading || false,
          error: styleInventory.error || null,
          pagination: styleInventory.pagination || { page: 1, total: 0, hasMore: false },
          searchInventory: styleInventory.searchInventory,
          clearSearch: styleInventory.clearSearch,
          loadMore: styleInventory.loadMore,
          exportInventory: styleInventory.exportInventory
        };
        
      default:
        return {
          inventory: skuInventory.inventory || [],
          statistics: skuInventory.statistics || null,
          loading: skuInventory.loading || false,
          error: skuInventory.error || null,
          pagination: skuInventory.pagination || { page: 1, total: 0, hasMore: false },
          searchInventory: skuInventory.searchInventory,
          clearSearch: skuInventory.clearSearch,
          loadMore: skuInventory.loadMore,
          exportInventory: skuInventory.exportInventory
        };
    }
  };

  // Use useMemo to recalculate currentData when dependencies change
  const currentData = React.useMemo(() => getCurrentViewData(), [
    currentView,
    skuInventory.inventory,
    skuInventory.statistics,
    skuInventory.loading,
    skuInventory.error,
    skuInventory.pagination,
    classInventory.inventory,
    classInventory.statistics,
    classInventory.loading,
    classInventory.error,
    classInventory.pagination,
    styleInventory.inventory,
    styleInventory.statistics,
    styleInventory.loading,
    styleInventory.error,
    styleInventory.pagination,
  ]);

  // Error boundary for the component
  if (hasError) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">There was an error loading the inventory data.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  // Handle view change
  const handleViewChange = (view: InventoryViewType) => {
    setCurrentView(view);
  };

  const handleFiltersChange = (newFilters: InventoryFilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
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
          filename = `consolidated-sku-inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
          headers = [
            'SKU Code',
            'Brand',
            'Style',
            'Class',
            'Color',
            'Size',
            'Total Quantity',
            'Reserved Quantity',
            'Available Quantity',
            'Warehouse Count',
            'Locations Count'
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
      let itemCode = '';

      // Type-safe way to find the item based on current view
      if (currentView === 'sku') {
        item = (currentInventory as any[]).find((inv: any) => inv.sku_id === id);
        itemName = item?.sku_code || 'Unknown SKU';
        itemCode = item?.sku_code || '';
      } else if (currentView === 'class') {
        item = (currentInventory as any[]).find((inv: any) => inv.class_id === id);
        itemName = item?.class_name || 'Unknown Class';
        itemCode = item?.class_name || '';
      } else if (currentView === 'style') {
        item = (currentInventory as any[]).find((inv: any) => inv.style_id === id);
        itemName = item?.style_name || 'Unknown Style';
        itemCode = item?.style_name || '';
      }

      if (!item) {
        toast.error('Item not found');
        return;
      }
      
      setLocationsModal({
        isOpen: true,
        viewType: currentView,
        itemId: id,
        itemName,
        itemCode
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

  try {
    return (
      <div className="space-y-4">
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

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        loading={currentData.loading}
      />

      {/* Render appropriate table based on current view */}
      {currentView === 'sku' && (
        <ConsolidatedSkuInventoryTable
          inventory={currentData.inventory as any}
          statistics={currentData.statistics}
          loading={currentData.loading}
          error={currentData.error}
          pagination={currentData.pagination}
          onSearch={currentData.searchInventory}
          onClearSearch={currentData.clearSearch}
          onLoadMore={currentData.loadMore}
          onExport={handleExport}
          onViewLocations={handleViewLocations}
          title="Consolidated SKU Inventory"
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

      {/* Enhanced Locations Modal */}
      <EnhancedInventoryLocationsModal
        isOpen={locationsModal.isOpen}
        onClose={closeLocationsModal}
        viewType={locationsModal.viewType}
        itemId={locationsModal.itemId}
        itemName={locationsModal.itemName}
        itemCode={locationsModal.itemCode}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="inventory"
      />
    </div>
  );
  } catch (error) {
    console.error('Error in Inventory component:', error);
    setHasError(true);
    return (
      <div className="space-y-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">There was an error loading the inventory data.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
};

export default Inventory; 
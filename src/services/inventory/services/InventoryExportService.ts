import { supabase } from '@/integrations/supabase/client';
import { WarehouseInventory } from '../types';

export class InventoryExportService {
  // Export inventory for a specific warehouse
  async exportInventory(warehouseId: string): Promise<any[]> {
    try {
      // First, get basic inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          sku:skus(
            *,
            class:classes(
              *,
              style:styles(
                *,
                brand:brands(*),
                category:categories(*)
              ),
              color:colors(*)
            ),
            size:sizes(*)
          )
        `)
        .eq('warehouse_id', warehouseId);

      if (inventoryError) {
        console.error('Error fetching inventory data:', inventoryError);
        throw inventoryError;
      }

      if (!inventoryData || inventoryData.length === 0) {
        return [];
      }

      // Get location data for all inventory items
      const inventoryIds = inventoryData.map(item => item.id);
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_inventory_locations')
        .select(`
          *,
          floor:warehouse_floors(*),
          lane:warehouse_lanes(*),
          rack:warehouse_racks(*)
        `)
        .in('inventory_id', inventoryIds);

      if (locationError) {
        console.error('Error fetching location data:', locationError);
        throw locationError;
      }

      // Get SKU data for all SKUs
      const skuIds = inventoryData.map(item => item.sku_id);
      const { data: skuData, error: skuError } = await supabase
        .from('skus')
        .select(`
          *,
          class:classes(
            *,
            style:styles(
              *,
              brand:brands(*),
              category:categories(*)
            ),
            color:colors(*)
          ),
          size:sizes(*)
        `)
        .in('id', skuIds);

      if (skuError) {
        console.error('Error fetching SKU data:', skuError);
        throw skuError;
      }

      // Create a map for quick lookup
      const skuMap = new Map();
      skuData?.forEach(sku => {
        skuMap.set(sku.id, sku);
      });

      const locationMap = new Map();
      locationData?.forEach(location => {
        if (!locationMap.has(location.inventory_id)) {
          locationMap.set(location.inventory_id, []);
        }
        locationMap.get(location.inventory_id).push(location);
      });

      // Prepare export data
      const exportData = inventoryData.map(inventory => {
        const sku = skuMap.get(inventory.sku_id);
        const locations = locationMap.get(inventory.id) || [];

        return {
          // Inventory details
          inventory_id: inventory.id,
          warehouse_id: inventory.warehouse_id,
          total_quantity: inventory.total_quantity,
          available_quantity: inventory.available_quantity,
          reserved_quantity: inventory.reserved_quantity,
          damaged_quantity: inventory.damaged_quantity,
          created_at: inventory.created_at,
          updated_at: inventory.updated_at,

          // SKU details
          sku_id: inventory.sku_id,
          sku_code: sku?.sku_code,
          sku_name: sku?.name,
          sku_description: sku?.description,

          // Class details
          class_id: sku?.class?.id,
          class_name: sku?.class?.name,
          class_description: sku?.class?.description,

          // Style details
          style_id: sku?.class?.style?.id,
          style_name: sku?.class?.style?.name,
          style_description: sku?.class?.style?.description,

          // Brand details
          brand_id: sku?.class?.style?.brand?.id,
          brand_name: sku?.class?.style?.brand?.name,
          brand_description: sku?.class?.style?.brand?.description,

          // Category details
          category_id: sku?.class?.style?.category?.id,
          category_name: sku?.class?.style?.category?.name,
          category_description: sku?.class?.style?.category?.description,

          // Color details
          color_id: sku?.class?.color?.id,
          color_name: sku?.class?.color?.name,
          color_code: sku?.class?.color?.code,

          // Size details
          size_id: sku?.size?.id,
          size_name: sku?.size?.name,
          size_code: sku?.size?.code,

          // Location details (flattened)
          locations: locations.map(location => ({
            floor_name: location.floor?.name,
            lane_name: location.lane?.name,
            rack_name: location.rack?.name,
            quantity: location.quantity
          }))
        };
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting inventory:', error);
      throw new Error('Failed to export inventory');
    }
  }

  // Export global inventory
  async exportGlobalInventory(): Promise<any[]> {
    try {
      const { data: inventory, error } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          warehouse:warehouses(*),
          sku:skus(
            *,
            class:classes(
              *,
              style:styles(
                *,
                brand:brands(*),
                category:categories(*)
              ),
              color:colors(*)
            ),
            size:sizes(*)
          ),
          locations:warehouse_inventory_locations(
            *,
            floor:warehouse_floors(*),
            lane:warehouse_lanes(*),
            rack:warehouse_racks(*)
          )
        `);

      if (error) {
        console.error('Error fetching global inventory:', error);
        throw error;
      }

      if (!inventory || inventory.length === 0) {
        return [];
      }

      // Prepare export data
      const exportData = inventory.map(item => ({
        // Inventory details
        inventory_id: item.id,
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouse?.name,
        warehouse_city: item.warehouse?.city,
        warehouse_state: item.warehouse?.state,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
        damaged_quantity: item.damaged_quantity,
        created_at: item.created_at,
        updated_at: item.updated_at,

        // SKU details
        sku_id: item.sku?.id,
        sku_code: item.sku?.sku_code,
        sku_name: item.sku?.name,
        sku_description: item.sku?.description,

        // Class details
        class_id: item.sku?.class?.id,
        class_name: item.sku?.class?.name,
        class_description: item.sku?.class?.description,

        // Style details
        style_id: item.sku?.class?.style?.id,
        style_name: item.sku?.class?.style?.name,
        style_description: item.sku?.class?.style?.description,

        // Brand details
        brand_id: item.sku?.class?.style?.brand?.id,
        brand_name: item.sku?.class?.style?.brand?.name,
        brand_description: item.sku?.class?.style?.brand?.description,

        // Category details
        category_id: item.sku?.class?.style?.category?.id,
        category_name: item.sku?.class?.style?.category?.name,
        category_description: item.sku?.class?.style?.category?.description,

        // Color details
        color_id: item.sku?.class?.color?.id,
        color_name: item.sku?.class?.color?.name,
        color_code: item.sku?.class?.color?.code,

        // Size details
        size_id: item.sku?.size?.id,
        size_name: item.sku?.size?.name,
        size_code: item.sku?.size?.code,

        // Location details (flattened)
        locations: item.locations?.map(location => ({
          floor_name: location.floor?.name,
          lane_name: location.lane?.name,
          rack_name: location.rack?.name,
          quantity: location.quantity
        })) || []
      }));

      return exportData;
    } catch (error) {
      console.error('Error exporting global inventory:', error);
      throw new Error('Failed to export global inventory');
    }
  }

  // Export global class inventory
  async exportGlobalClassInventory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_class_inventory');

      if (error) {
        console.error('Error fetching global class inventory:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform the data for export
      const exportData = data.map((item: any) => ({
        class_id: item.class_id,
        class_name: item.class_name,
        class_description: item.class_description,
        style_id: item.style_id,
        style_name: item.style_name,
        style_description: item.style_description,
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        brand_description: item.brand_description,
        category_id: item.category_id,
        category_name: item.category_name,
        category_description: item.category_description,
        color_id: item.color_id,
        color_name: item.color_name,
        color_code: item.color_code,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
        damaged_quantity: item.damaged_quantity,
        warehouse_count: item.warehouse_count
      }));

      return exportData;
    } catch (error) {
      console.error('Error exporting global class inventory:', error);
      throw new Error('Failed to export global class inventory');
    }
  }

  // Export global style inventory
  async exportGlobalStyleInventory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_style_inventory');

      if (error) {
        console.error('Error fetching global style inventory:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform the data for export
      const exportData = data.map((item: any) => ({
        style_id: item.style_id,
        style_name: item.style_name,
        style_description: item.style_description,
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        brand_description: item.brand_description,
        category_id: item.category_id,
        category_name: item.category_name,
        category_description: item.category_description,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        reserved_quantity: item.reserved_quantity,
        damaged_quantity: item.damaged_quantity,
        warehouse_count: item.warehouse_count
      }));

      return exportData;
    } catch (error) {
      console.error('Error exporting global style inventory:', error);
      throw new Error('Failed to export global style inventory');
    }
  }

  // Export consolidated SKU inventory
  async exportConsolidatedSkuInventory(): Promise<any[]> {
    try {
      const { data: inventory, error } = await supabase
        .rpc('get_consolidated_sku_inventory');

      if (error) {
        console.error('Error fetching consolidated SKU inventory:', error);
        throw error;
      }

      if (!inventory || inventory.length === 0) {
        return [];
      }

      // Get SKU details for all SKUs
      const skuIds = inventory.map((item: any) => item.sku_id);
      const { data: skuData, error: skuError } = await supabase
        .from('skus')
        .select(`
          *,
          class:classes(
            *,
            style:styles(
              *,
              brand:brands(*),
              category:categories(*)
            ),
            color:colors(*)
          ),
          size:sizes(*)
        `)
        .in('id', skuIds);

      if (skuError) {
        console.error('Error fetching SKU data:', skuError);
        throw skuError;
      }

      // Create a map for quick lookup
      const skuMap = new Map();
      skuData?.forEach(sku => {
        skuMap.set(sku.id, sku);
      });

      // Prepare export data
      const exportData = inventory.map((item: any) => {
        const sku = skuMap.get(item.sku_id);

        return {
          // SKU details
          sku_id: item.sku_id,
          sku_code: sku?.sku_code,
          sku_name: sku?.name,
          sku_description: sku?.description,

          // Class details
          class_id: sku?.class?.id,
          class_name: sku?.class?.name,
          class_description: sku?.class?.description,

          // Style details
          style_id: sku?.class?.style?.id,
          style_name: sku?.class?.style?.name,
          style_description: sku?.class?.style?.description,

          // Brand details
          brand_id: sku?.class?.style?.brand?.id,
          brand_name: sku?.class?.style?.brand?.name,
          brand_description: sku?.class?.style?.brand?.description,

          // Category details
          category_id: sku?.class?.style?.category?.id,
          category_name: sku?.class?.style?.category?.name,
          category_description: sku?.class?.style?.category?.description,

          // Color details
          color_id: sku?.class?.color?.id,
          color_name: sku?.class?.color?.name,
          color_code: sku?.class?.color?.code,

          // Size details
          size_id: sku?.size?.id,
          size_name: sku?.size?.name,
          size_code: sku?.size?.code,

          // Consolidated quantities
          total_quantity: item.total_quantity,
          available_quantity: item.available_quantity,
          reserved_quantity: item.reserved_quantity,
          damaged_quantity: item.damaged_quantity,
          warehouse_count: item.warehouse_count
        };
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting consolidated SKU inventory:', error);
      throw new Error('Failed to export consolidated SKU inventory');
    }
  }
}

export const inventoryExportService = new InventoryExportService();

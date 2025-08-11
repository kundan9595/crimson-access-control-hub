import { supabase } from '@/integrations/supabase/client';
import {
  InventoryStatistics,
  InventoryFilters,
  ClassInventoryStatistics,
  StyleInventoryStatistics
} from '../types';

export class InventoryStatisticsService {
  // Get inventory statistics for a warehouse
  async getInventoryStatistics(warehouseId: string): Promise<InventoryStatistics> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select('total_quantity, available_quantity, reserved_quantity, damaged_quantity')
        .eq('warehouse_id', warehouseId);

      if (error) {
        console.error('❌ [InventoryStatisticsService] Database error:', error);
        throw error;
      }

      const stats = data.reduce(
        (acc, item) => {
          acc.totalItems += 1;
          acc.totalQuantity += Number(item.total_quantity) || 0;
          acc.availableQuantity += Number(item.available_quantity) || 0;
          acc.reservedQuantity += Number(item.reserved_quantity) || 0;
          acc.damagedQuantity += Number(item.damaged_quantity) || 0;
          return acc;
        },
        {
          totalItems: 0,
          totalQuantity: 0,
          availableQuantity: 0,
          reservedQuantity: 0,
          damagedQuantity: 0
        }
      );

      return stats;
    } catch (error) {
      console.error('❌ [InventoryStatisticsService] Error fetching inventory statistics:', error);
      throw new Error('Failed to fetch inventory statistics');
    }
  }

  // Get global inventory statistics
  async getGlobalInventoryStatistics(filters?: InventoryFilters): Promise<InventoryStatistics> {
    try {
      if (!filters || Object.keys(filters).length === 0) {
        // No filters - get overall statistics
        const { data, error } = await supabase
          .from('warehouse_inventory')
          .select('total_quantity, available_quantity, reserved_quantity, damaged_quantity');

        if (error) {
          console.error('❌ [InventoryStatisticsService] Database error:', error);
          throw error;
        }

        const total_items = data?.length || 0;
        const total_quantity = data?.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0) || 0;
        const available_quantity = data?.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0) || 0;
        const reserved_quantity = data?.reduce((sum, item) => sum + (Number(item.reserved_quantity) || 0), 0) || 0;
        const damaged_quantity = data?.reduce((sum, item) => sum + (Number(item.damaged_quantity) || 0), 0) || 0;

        const result = {
          totalItems: total_items,
          totalQuantity: total_quantity,
          availableQuantity: available_quantity,
          reservedQuantity: reserved_quantity,
          damagedQuantity: damaged_quantity
        };

        return result;
      } else {
        // Apply filters and get filtered statistics
        let query = supabase
          .from('warehouse_inventory')
          .select(`
            total_quantity, available_quantity, reserved_quantity, damaged_quantity,
            sku:skus(
              class:classes(
                style:styles(
                  brand:brands(*),
                  category:categories(*)
                )
              )
            )
          `);

        // Apply filters
        if (filters.brand_id) {
          query = query.eq('sku.class.style.brand.id', filters.brand_id);
        }
        if (filters.category_id) {
          query = query.eq('sku.class.style.category.id', filters.category_id);
        }
        if (filters.style_id) {
          query = query.eq('sku.class.style.id', filters.style_id);
        }
        if (filters.class_id) {
          query = query.eq('sku.class.id', filters.class_id);
        }
        if (filters.color_id) {
          query = query.eq('sku.class.color.id', filters.color_id);
        }
        if (filters.size_id) {
          query = query.eq('sku.size.id', filters.size_id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ [InventoryStatisticsService] Database error:', error);
          throw error;
        }

        const total_items = data?.length || 0;
        const total_quantity = data?.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0) || 0;
        const available_quantity = data?.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0) || 0;
        const reserved_quantity = data?.reduce((sum, item) => sum + (Number(item.reserved_quantity) || 0), 0) || 0;
        const damaged_quantity = data?.reduce((sum, item) => sum + (Number(item.damaged_quantity) || 0), 0) || 0;

        const result = {
          totalItems: total_items,
          totalQuantity: total_quantity,
          availableQuantity: available_quantity,
          reservedQuantity: reserved_quantity,
          damagedQuantity: damaged_quantity
        };

        return result;
      }
    } catch (error) {
      console.error('❌ [InventoryStatisticsService] Error fetching global inventory statistics:', error);
      throw new Error('Failed to fetch global inventory statistics');
    }
  }

  // Get global class inventory statistics
  async getGlobalClassInventoryStatistics(): Promise<ClassInventoryStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_class_inventory_statistics');

      if (error) {
        console.error('❌ [InventoryStatisticsService] Database error:', error);
        throw error;
      }

      // Handle the case where RPC returns an array with one element
      const stats = Array.isArray(data) ? data[0] : data;
      return stats as ClassInventoryStatistics;
    } catch (error) {
      console.error('❌ [InventoryStatisticsService] Error fetching global class inventory statistics:', error);
      throw new Error('Failed to fetch global class inventory statistics');
    }
  }

  // Get global style inventory statistics
  async getGlobalStyleInventoryStatistics(): Promise<StyleInventoryStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_style_inventory_statistics');

      if (error) {
        console.error('❌ [InventoryStatisticsService] Database error:', error);
        throw error;
      }

      // Handle the case where RPC returns an array with one element
      const stats = Array.isArray(data) ? data[0] : data;
      return stats as StyleInventoryStatistics;
    } catch (error) {
      console.error('❌ [InventoryStatisticsService] Error fetching global style inventory statistics:', error);
      throw new Error('Failed to fetch global style inventory statistics');
    }
  }

  // Get consolidated SKU inventory statistics
  async getConsolidatedSkuInventoryStatistics(): Promise<InventoryStatistics> {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_consolidated_sku_inventory_statistics');

      if (error) {
        console.error('❌ [InventoryStatisticsService] Database error:', error);
        throw error;
      }

      // Handle the case where RPC returns an array with one element
      const statsData = Array.isArray(stats) ? stats[0] : stats;

      const result = {
        totalItems: statsData?.total_skus || 0,
        totalQuantity: statsData?.total_quantity || 0,
        availableQuantity: statsData?.available_quantity || 0,
        reservedQuantity: statsData?.reserved_quantity || 0,
        damagedQuantity: 0 // Not available in consolidated SKU statistics
      };

      return result;
    } catch (error) {
      console.error('❌ [InventoryStatisticsService] Error fetching consolidated SKU inventory statistics:', error);
      throw new Error('Failed to fetch consolidated SKU inventory statistics');
    }
  }

  // Get inventory count by rack
  async getInventoryCountByRack(rackId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('warehouse_inventory_locations')
        .select('*', { count: 'exact', head: true })
        .eq('rack_id', rackId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching inventory count by rack:', error);
      throw new Error('Failed to fetch inventory count by rack');
    }
  }

  // Get inventory quantity by rack
  async getInventoryQuantityByRack(rackId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory_locations')
        .select('quantity')
        .eq('rack_id', rackId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    } catch (error) {
      console.error('Error fetching inventory quantity by rack:', error);
      throw new Error('Failed to fetch inventory quantity by rack');
    }
  }

  // Get inventory statistics by warehouse
  async getInventoryStatisticsByWarehouse(): Promise<Array<{
    warehouse_id: string;
    warehouse_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_warehouse');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by warehouse:', error);
      throw new Error('Failed to fetch inventory statistics by warehouse');
    }
  }

  // Get inventory statistics by brand
  async getInventoryStatisticsByBrand(): Promise<Array<{
    brand_id: string;
    brand_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_brand');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by brand:', error);
      throw new Error('Failed to fetch inventory statistics by brand');
    }
  }

  // Get inventory statistics by category
  async getInventoryStatisticsByCategory(): Promise<Array<{
    category_id: string;
    category_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_category');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by category:', error);
      throw new Error('Failed to fetch inventory statistics by category');
    }
  }

  // Get inventory statistics by style
  async getInventoryStatisticsByStyle(): Promise<Array<{
    style_id: string;
    style_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_style');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by style:', error);
      throw new Error('Failed to fetch inventory statistics by style');
    }
  }

  // Get inventory statistics by class
  async getInventoryStatisticsByClass(): Promise<Array<{
    class_id: string;
    class_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_class');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by class:', error);
      throw new Error('Failed to fetch inventory statistics by class');
    }
  }

  // Get inventory statistics by color
  async getInventoryStatisticsByColor(): Promise<Array<{
    color_id: string;
    color_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_color');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by color:', error);
      throw new Error('Failed to fetch inventory statistics by color');
    }
  }

  // Get inventory statistics by size
  async getInventoryStatisticsBySize(): Promise<Array<{
    size_id: string;
    size_name: string;
    total_items: number;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    damaged_quantity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_inventory_statistics_by_size');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching inventory statistics by size:', error);
      throw new Error('Failed to fetch inventory statistics by size');
    }
  }
}

export const inventoryStatisticsService = new InventoryStatisticsService();

import { supabase } from '@/integrations/supabase/client';
import {
  InventorySearchParams,
  InventorySearchResult,
  InventoryStatistics,
  InventoryFilters,
  ClassInventorySearchResult,
  StyleInventorySearchResult,
  ClassInventoryStatistics,
  StyleInventoryStatistics
} from '../types';

export class GlobalInventoryService {
  // Get global inventory across all warehouses
  async getGlobalInventory(
    params: InventorySearchParams = {}
  ): Promise<InventorySearchResult> {
    try {
      // Build filter conditions
      let query = supabase
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

      // Apply search query
      if (params.query) {
        query = query.ilike('sku.sku_code', `%${params.query}%`);
      }

      // Apply filters
      if (params.filters) {
        if (params.filters.sku_code) {
          query = query.eq('sku.sku_code', params.filters.sku_code);
        }
        if (params.filters.min_quantity !== undefined) {
          query = query.gte('available_quantity', params.filters.min_quantity);
        }
        if (params.filters.max_quantity !== undefined) {
          query = query.lte('available_quantity', params.filters.max_quantity);
        }
        if (params.filters.has_stock !== undefined) {
          if (params.filters.has_stock) {
            query = query.gt('available_quantity', 0);
          } else {
            query = query.eq('available_quantity', 0);
          }
        }
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Global inventory result
      return {
        inventory: data as any[],
        total: count || 0,
        hasMore: (data?.length || 0) === limit
      };
    } catch (error) {
      console.error('Error fetching global inventory:', error);
      throw new Error('Failed to fetch global inventory');
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
          console.error('Database error:', error);
          throw error;
        }

        const total_items = data?.length || 0;
        const total_quantity = data?.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0) || 0;
        const available_quantity = data?.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0) || 0;
        const reserved_quantity = data?.reduce((sum, item) => sum + (Number(item.reserved_quantity) || 0), 0) || 0;
        const damaged_quantity = data?.reduce((sum, item) => sum + (Number(item.damaged_quantity) || 0), 0) || 0;

        // Global inventory statistics
        return {
          totalItems: total_items,
          totalQuantity: total_quantity,
          availableQuantity: available_quantity,
          reservedQuantity: reserved_quantity,
          damagedQuantity: damaged_quantity
        };
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
          console.error('Database error:', error);
          throw error;
        }

        const total_items = data?.length || 0;
        const total_quantity = data?.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0) || 0;
        const available_quantity = data?.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0) || 0;
        const reserved_quantity = data?.reduce((sum, item) => sum + (Number(item.reserved_quantity) || 0), 0) || 0;
        const damaged_quantity = data?.reduce((sum, item) => sum + (Number(item.damaged_quantity) || 0), 0) || 0;

        // Filtered inventory statistics
        return {
          totalItems: total_items,
          totalQuantity: total_quantity,
          availableQuantity: available_quantity,
          reservedQuantity: reserved_quantity,
          damagedQuantity: damaged_quantity
        };
      }
    } catch (error) {
      console.error('Error fetching global inventory statistics:', error);
      throw new Error('Failed to fetch global inventory statistics');
    }
  }

  // Get global class inventory
  async getGlobalClassInventory(
    params: InventorySearchParams = {}
  ): Promise<ClassInventorySearchResult> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_class_inventory');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Global class inventory RPC result
      return {
        inventory: data as any[],
        total: data?.length || 0,
        hasMore: false
      };
    } catch (error) {
      console.error('Error fetching global class inventory:', error);
      throw new Error('Failed to fetch global class inventory');
    }
  }

  // Get global style inventory
  async getGlobalStyleInventory(
    params: InventorySearchParams = {}
  ): Promise<StyleInventorySearchResult> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_style_inventory');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Global style inventory RPC result
      return {
        inventory: data as any[],
        total: data?.length || 0,
        hasMore: false
      };
    } catch (error) {
      console.error('Error fetching global style inventory:', error);
      throw new Error('Failed to fetch global style inventory');
    }
  }

  // Get global class inventory statistics
  async getGlobalClassInventoryStatistics(): Promise<ClassInventoryStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_class_inventory_statistics');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data as ClassInventoryStatistics;
    } catch (error) {
      console.error('Error fetching global class inventory statistics:', error);
      throw new Error('Failed to fetch global class inventory statistics');
    }
  }

  // Get global style inventory statistics
  async getGlobalStyleInventoryStatistics(): Promise<StyleInventoryStatistics> {
    try {
      const { data, error } = await supabase
        .rpc('get_global_style_inventory_statistics');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data as StyleInventoryStatistics;
    } catch (error) {
      console.error('Error fetching global style inventory statistics:', error);
      throw new Error('Failed to fetch global style inventory statistics');
    }
  }

  // Get consolidated SKU inventory
  async getConsolidatedSkuInventory(
    params: InventorySearchParams = {}
  ): Promise<InventorySearchResult> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const searchQuery = params.query || null;
      const filters = params.filters || {};

      // Check if we have any filters applied
      const hasFilters = Object.keys(filters).some(key => {
        const value = filters[key as keyof typeof filters];
        return value !== undefined && value !== '' && value !== 'all';
      });

      if (hasFilters) {
        // Use the filtered function when filters are applied
        const { data: inventory, error } = await supabase
          .rpc('get_filtered_consolidated_sku_inventory', {
            search_query: searchQuery,
            warehouse_id: filters.warehouse_id || null,
            brand_name: filters.brand || null,
            category_name: filters.category || null,
            color_name: filters.color || null,
            size_name: filters.size || null,
            min_quantity: filters.min_quantity || null,
            max_quantity: filters.max_quantity || null,
            stock_status: filters.stock_status || null,
            has_reservations: filters.has_reservations || null,
            page_number: page,
            page_size: limit
          });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Get total count with the same filters
        const { data: totalCount, error: countError } = await supabase
          .rpc('get_filtered_consolidated_sku_inventory_count', {
            search_query: searchQuery,
            warehouse_id: filters.warehouse_id || null,
            brand_name: filters.brand || null,
            category_name: filters.category || null,
            color_name: filters.color || null,
            size_name: filters.size || null,
            min_quantity: filters.min_quantity || null,
            max_quantity: filters.max_quantity || null,
            stock_status: filters.stock_status || null,
            has_reservations: filters.has_reservations || null
          });

        if (countError) {
          console.error('Database error getting count:', countError);
          throw countError;
        }

        const hasMore = (inventory?.length || 0) === limit;

        return {
          inventory: inventory as any[],
          total: totalCount || 0,
          hasMore
        };
      } else {
        // Use the basic function when no filters are applied
        const { data: inventory, error } = await supabase
          .rpc('get_consolidated_sku_inventory', {
            search_query: searchQuery,
            page_number: page,
            page_size: limit
          });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }

        // Get total count with the same search query
        const { data: totalCount, error: countError } = await supabase
          .rpc('get_consolidated_sku_inventory_count', {
            search_query: searchQuery
          });

        if (countError) {
          console.error('Database error getting count:', countError);
          throw countError;
        }

        const hasMore = (inventory?.length || 0) === limit;

        return {
          inventory: inventory as any[],
          total: totalCount || 0,
          hasMore
        };
      }
    } catch (error) {
      console.error('Error fetching consolidated SKU inventory:', error);
      throw new Error('Failed to fetch consolidated SKU inventory');
    }
  }

  // Get consolidated SKU inventory statistics
  async getConsolidatedSkuInventoryStatistics(): Promise<InventoryStatistics> {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_consolidated_sku_inventory_statistics');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const result = {
        totalItems: stats?.total_skus || 0,
        totalQuantity: stats?.total_quantity || 0,
        availableQuantity: stats?.available_quantity || 0,
        reservedQuantity: stats?.reserved_quantity || 0,
        warehouseCount: stats?.total_warehouses || 0
      };

      // Consolidated SKU statistics result
      return result;
    } catch (error) {
      console.error('Error fetching consolidated SKU inventory statistics:', error);
      throw new Error('Failed to fetch consolidated SKU inventory statistics');
    }
  }

  // Get SKU locations by warehouse
  async getSkuLocationsByWarehouse(skuId: string): Promise<any[]> {
    try {
      const { data: locations, error } = await supabase
        .rpc('get_sku_locations_by_warehouse', { sku_id_param: skuId });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // SKU locations by warehouse result
      return locations || [];
    } catch (error) {
      console.error('Error fetching SKU locations by warehouse:', error);
      throw new Error('Failed to fetch SKU locations by warehouse');
    }
  }

  // Search SKUs
  async searchSkus(query: string, limit: number = 10): Promise<any[]> {
    try {
      // Try the simplest approach first - just get SKUs with basic info
      const { data: basicData, error: basicError } = await supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          name,
          description,
          class:classes(
            id,
            name,
            style:styles(
              id,
              name,
              brand:brands(id, name),
              category:categories(id, name)
            ),
            color:colors(id, name, code)
          ),
          size:sizes(id, name, code)
        `)
        .ilike('sku_code', `%${query}%`)
        .limit(limit);

      if (basicError) {
        console.error('Error in basic SKU search:', basicError);
        throw basicError;
      }

      // Basic SKU search results
      if (!basicData || basicData.length === 0) {
        // Try searching by name if no results by SKU code
        const { data: nameData, error: nameError } = await supabase
          .from('skus')
          .select(`
            id,
            sku_code,
            name,
            description,
            class:classes(
              id,
              name,
              style:styles(
                id,
                name,
                brand:brands(id, name),
                category:categories(id, name)
              ),
              color:colors(id, name, code)
            ),
            size:sizes(id, name, code)
          `)
          .ilike('name', `%${query}%`)
          .limit(limit);

        if (nameError) {
          console.error('Error in name-based SKU search:', nameError);
          throw nameError;
        }

        return nameData || [];
      }

      return basicData;
    } catch (error) {
      console.error('Error searching SKUs:', error);
      throw new Error('Failed to search SKUs');
    }
  }

  // Get warehouses list
  async getWarehouses(): Promise<Array<{ id: string; name: string; city?: string; state?: string }>> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, city, state')
        .order('name');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('Failed to fetch warehouses');
    }
  }
}

export const globalInventoryService = new GlobalInventoryService();

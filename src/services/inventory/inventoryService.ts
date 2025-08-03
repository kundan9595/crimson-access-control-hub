import { supabase } from '@/integrations/supabase/client';
import {
  WarehouseInventory,
  WarehouseInventoryLocation,
  WarehouseInventoryReservation,
  AddInventoryRequest,
  UpdateInventoryRequest,
  InventorySearchParams,
  InventorySearchResult,
  InventoryStatistics,
  InventoryFilters
} from './types';

class InventoryService {
  // Get inventory for a specific warehouse
  async getWarehouseInventory(
    warehouseId: string,
    params: InventorySearchParams = {}
  ): Promise<InventorySearchResult> {
    try {
      console.log('Getting warehouse inventory for warehouseId:', warehouseId, 'with params:', params);
      
      // Start with basic query
      let query = supabase
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
          ),
          locations:warehouse_inventory_locations(
            *,
            floor:warehouse_floors(*),
            lane:warehouse_lanes(*),
            rack:warehouse_racks(*)
          ),
          reservations:warehouse_inventory_reservations(*)
        `)
        .eq('warehouse_id', warehouseId);

      // Apply search query - simplified approach
      if (params.query) {
        // Try simple SKU code search first
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

      console.log('Executing query with range:', { from, to, limit });
      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Query result:', { data: data?.length, count, hasMore: (data?.length || 0) === limit });

      return {
        inventory: data as WarehouseInventory[],
        total: count || 0,
        hasMore: (data?.length || 0) === limit
      };
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      throw new Error('Failed to fetch warehouse inventory');
    }
  }

  // Get inventory by ID with full details
  async getInventoryById(inventoryId: string): Promise<WarehouseInventory | null> {
    try {
      const { data, error } = await supabase
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
          ),
          locations:warehouse_inventory_locations(
            *,
            floor:warehouse_floors(*),
            lane:warehouse_lanes(*),
            rack:warehouse_racks(*)
          ),
          reservations:warehouse_inventory_reservations(*)
        `)
        .eq('id', inventoryId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as WarehouseInventory;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new Error('Failed to fetch inventory details');
    }
  }

  // Add inventory to warehouse
  async addInventory(request: AddInventoryRequest): Promise<WarehouseInventory> {
    try {
      console.log('Adding inventory with request:', request);

      // Check if inventory already exists for this SKU in this warehouse
      const { data: existingInventory, error: checkError } = await supabase
        .from('warehouse_inventory')
        .select('id')
        .eq('warehouse_id', request.warehouse_id)
        .eq('sku_id', request.sku_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing inventory:', checkError);
        throw checkError;
      }

      let inventoryId: string;

      if (existingInventory) {
        // Update existing inventory
        console.log('Updating existing inventory:', existingInventory.id);
        inventoryId = existingInventory.id;
      } else {
        // Create new inventory
        console.log('Creating new inventory record');
        const { data: inventory, error: inventoryError } = await supabase
          .from('warehouse_inventory')
          .insert([{
            warehouse_id: request.warehouse_id,
            sku_id: request.sku_id,
            total_quantity: 0, // Will be calculated by trigger
            reserved_quantity: 0
          }])
          .select()
          .single();

        if (inventoryError) {
          console.error('Error creating inventory:', inventoryError);
          throw inventoryError;
        }

        inventoryId = inventory.id;
      }

      // Add locations
      if (request.locations.length > 0) {
        for (const location of request.locations) {
          // Check if location already exists
          const { data: existingLocation, error: checkLocationError } = await supabase
            .from('warehouse_inventory_locations')
            .select('id, quantity')
            .eq('warehouse_inventory_id', inventoryId)
            .eq('floor_id', location.floor_id)
            .eq('lane_id', location.lane_id)
            .eq('rack_id', location.rack_id)
            .single();

          if (checkLocationError && checkLocationError.code !== 'PGRST116') {
            console.error('Error checking existing location:', checkLocationError);
            throw checkLocationError;
          }

          if (existingLocation) {
            // Update existing location quantity
            console.log('Updating existing location quantity:', existingLocation.id);
            const { error: updateError } = await supabase
              .from('warehouse_inventory_locations')
              .update({ quantity: existingLocation.quantity + location.quantity })
              .eq('id', existingLocation.id);

            if (updateError) {
              console.error('Error updating location:', updateError);
              throw updateError;
            }
          } else {
            // Insert new location
            console.log('Adding new location:', location);
            const { error: insertError } = await supabase
              .from('warehouse_inventory_locations')
              .insert([{
                warehouse_inventory_id: inventoryId,
                floor_id: location.floor_id,
                lane_id: location.lane_id,
                rack_id: location.rack_id,
                quantity: location.quantity
              }]);

            if (insertError) {
              console.error('Error inserting location:', insertError);
              throw insertError;
            }
          }
        }
      }

      // Return the updated inventory with all relations
      const result = await this.getInventoryById(inventoryId) as WarehouseInventory;
      console.log('Successfully added inventory:', result);
      return result;
    } catch (error) {
      console.error('Error adding inventory:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to add inventory: ${error.message}`);
      }
      throw new Error('Failed to add inventory');
    }
  }

  // Update inventory locations
  async updateInventory(request: UpdateInventoryRequest): Promise<WarehouseInventory> {
    try {
      // Delete existing locations
      const { error: deleteError } = await supabase
        .from('warehouse_inventory_locations')
        .delete()
        .eq('warehouse_inventory_id', request.warehouse_inventory_id);

      if (deleteError) throw deleteError;

      // Add new locations
      if (request.locations.length > 0) {
        const locationData = request.locations.map(location => ({
          warehouse_inventory_id: request.warehouse_inventory_id,
          floor_id: location.floor_id,
          lane_id: location.lane_id,
          rack_id: location.rack_id,
          quantity: location.quantity
        }));

        const { error: locationError } = await supabase
          .from('warehouse_inventory_locations')
          .insert(locationData);

        if (locationError) throw locationError;
      }

      // Return the updated inventory
      return await this.getInventoryById(request.warehouse_inventory_id) as WarehouseInventory;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  // Delete inventory
  async deleteInventory(inventoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('warehouse_inventory')
        .delete()
        .eq('id', inventoryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw new Error('Failed to delete inventory');
    }
  }

  // Add reservation
  async addReservation(
    inventoryId: string,
    quantity: number,
    reservationType: 'order' | 'manual' | 'damaged' = 'manual',
    orderId?: string,
    notes?: string
  ): Promise<WarehouseInventoryReservation> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory_reservations')
        .insert([{
          warehouse_inventory_id: inventoryId,
          order_id: orderId,
          quantity,
          reservation_type: reservationType,
          status: 'active',
          notes
        }])
        .select()
        .single();

      if (error) throw error;
      return data as WarehouseInventoryReservation;
    } catch (error) {
      console.error('Error adding reservation:', error);
      throw new Error('Failed to add reservation');
    }
  }

  // Update reservation status
  async updateReservationStatus(
    reservationId: string,
    status: 'active' | 'fulfilled' | 'cancelled'
  ): Promise<WarehouseInventoryReservation> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory_reservations')
        .update({ status })
        .eq('id', reservationId)
        .select()
        .single();

      if (error) throw error;
      return data as WarehouseInventoryReservation;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw new Error('Failed to update reservation');
    }
  }

  // Get inventory statistics for a warehouse
  async getInventoryStatistics(warehouseId: string): Promise<InventoryStatistics> {
    try {
      console.log('Getting inventory statistics for warehouseId:', warehouseId);
      
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select('total_quantity, reserved_quantity, available_quantity')
        .eq('warehouse_id', warehouseId);

      if (error) {
        console.error('Error in statistics query:', error);
        throw error;
      }

      console.log('Statistics raw data:', data);

      const stats = data.reduce(
        (acc, item) => ({
          total_items: acc.total_items + 1,
          total_quantity: acc.total_quantity + item.total_quantity,
          reserved_quantity: acc.reserved_quantity + item.reserved_quantity,
          available_quantity: acc.available_quantity + item.available_quantity,
          low_stock_items: acc.low_stock_items + (item.available_quantity > 0 && item.available_quantity <= 10 ? 1 : 0),
          out_of_stock_items: acc.out_of_stock_items + (item.available_quantity === 0 ? 1 : 0)
        }),
        {
          total_items: 0,
          total_quantity: 0,
          reserved_quantity: 0,
          available_quantity: 0,
          low_stock_items: 0,
          out_of_stock_items: 0
        }
      );

      console.log('Calculated statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching inventory statistics:', error);
      throw new Error('Failed to fetch inventory statistics');
    }
  }

  // Get inventory count by rack
  async getInventoryCountByRack(rackId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('warehouse_inventory_locations')
        .select('*', { count: 'exact', head: true })
        .eq('rack_id', rackId)
        .gt('quantity', 0);

      if (error) {
        console.error('Error fetching rack inventory count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting inventory count by rack:', error);
      return 0;
    }
  }

  // Get total inventory quantity by rack
  async getInventoryQuantityByRack(rackId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory_locations')
        .select('quantity')
        .eq('rack_id', rackId)
        .gt('quantity', 0);

      if (error) {
        console.error('Error getting inventory quantity by rack:', error);
        throw error;
      }

      const totalQuantity = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      return totalQuantity;
    } catch (error) {
      console.error('Error getting inventory quantity by rack:', error);
      return 0;
    }
  }

  // Get inventory by rack
  async getInventoryByRack(rackId: string): Promise<WarehouseInventory[]> {
    try {
      console.log('Getting inventory for rackId:', rackId);
      
      // First, get all inventory locations for this rack
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_inventory_locations')
        .select('warehouse_inventory_id, quantity')
        .eq('rack_id', rackId)
        .gt('quantity', 0);

      if (locationError) {
        console.error('Error fetching rack locations:', locationError);
        throw locationError;
      }

      console.log('Rack locations found:', locationData);

      if (!locationData || locationData.length === 0) {
        console.log('No inventory found for rack:', rackId);
        return [];
      }

      // Get the inventory IDs that have items in this rack
      const inventoryIds = locationData.map(loc => loc.warehouse_inventory_id);

      // Now get the full inventory data for these items
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
          ),
          locations:warehouse_inventory_locations(
            *,
            floor:warehouse_floors(*),
            lane:warehouse_lanes(*),
            rack:warehouse_racks(*)
          ),
          reservations:warehouse_inventory_reservations(*)
        `)
        .in('id', inventoryIds);

      if (inventoryError) {
        console.error('Error fetching inventory data:', inventoryError);
        throw inventoryError;
      }

      console.log('Rack inventory data:', inventoryData);
      return inventoryData as WarehouseInventory[];
    } catch (error) {
      console.error('Error getting inventory by rack:', error);
      throw new Error('Failed to fetch rack inventory');
    }
  }

  // Export inventory data for a warehouse
  async exportInventory(warehouseId: string): Promise<any[]> {
    try {
      console.log('Starting inventory export for warehouseId:', warehouseId);
      
      // First, get basic inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          sku:skus(sku_code)
        `)
        .eq('warehouse_id', warehouseId);

      if (inventoryError) {
        console.error('Error fetching inventory data:', inventoryError);
        throw inventoryError;
      }

      console.log('Inventory data fetched:', inventoryData?.length, 'records');

      if (!inventoryData || inventoryData.length === 0) {
        return [];
      }

      // Get locations for all inventory items
      const inventoryIds = inventoryData.map(inv => inv.id);
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_inventory_locations')
        .select(`
          *,
          floor:warehouse_floors(name),
          lane:warehouse_lanes(name),
          rack:warehouse_racks(rack_name)
        `)
        .in('warehouse_inventory_id', inventoryIds);

      if (locationError) {
        console.error('Error fetching location data:', locationError);
        throw locationError;
      }

      console.log('Location data fetched:', locationData?.length, 'records');

      // Get SKU details for all SKUs
      const skuIds = inventoryData.map(inv => inv.sku_id).filter(Boolean);
      const { data: skuData, error: skuError } = await supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          class:classes(
            style:styles(
              brand:brands(name),
              name
            ),
            color:colors(name)
          ),
          size:sizes(name)
        `)
        .in('id', skuIds);

      if (skuError) {
        console.error('Error fetching SKU data:', skuError);
        throw skuError;
      }

      console.log('SKU data fetched:', skuData?.length, 'records');

      // Create a map for quick lookup
      const skuMap = new Map(skuData?.map(sku => [sku.id, sku]) || []);
      const locationMap = new Map();
      
      locationData?.forEach(location => {
        const inventoryId = location.warehouse_inventory_id;
        if (!locationMap.has(inventoryId)) {
          locationMap.set(inventoryId, []);
        }
        locationMap.get(inventoryId).push(location);
      });

      // Transform data for export
      const exportData = inventoryData.map(inventory => {
        const sku = skuMap.get(inventory.sku_id);
        const locations = locationMap.get(inventory.id) || [];
        
        if (locations.length === 0) {
          // If no locations, create one record with empty location data
          return [{
            sku_code: sku?.sku_code || '',
            brand: sku?.class?.style?.brand?.name || '',
            product_name: sku?.class?.style?.name || '',
            color: sku?.class?.color?.name || '',
            size: sku?.size?.name || '',
            floor_name: '',
            lane_name: '',
            rack_name: '',
            quantity: 0,
            total_quantity: inventory.total_quantity || 0,
            reserved_quantity: inventory.reserved_quantity || 0,
            available_quantity: inventory.available_quantity || 0,
            created_at: inventory.created_at || ''
          }];
        }

        return locations.map(location => ({
          sku_code: sku?.sku_code || '',
          brand: sku?.class?.style?.brand?.name || '',
          product_name: sku?.class?.style?.name || '',
          color: sku?.class?.color?.name || '',
          size: sku?.size?.name || '',
          floor_name: location.floor?.name || '',
          lane_name: location.lane?.name || '',
          rack_name: location.rack?.rack_name || '',
          quantity: location.quantity || 0,
          total_quantity: inventory.total_quantity || 0,
          reserved_quantity: inventory.reserved_quantity || 0,
          available_quantity: inventory.available_quantity || 0,
          created_at: inventory.created_at || ''
        }));
      }).flat();

      console.log('Export data prepared:', exportData.length, 'records');
      return exportData;
    } catch (error) {
      console.error('Error exporting inventory:', error);
      throw new Error('Failed to export inventory');
    }
  }

  // Get global inventory across all warehouses
  async getGlobalInventory(
    params: InventorySearchParams = {}
  ): Promise<InventorySearchResult> {
    try {
      console.log('Getting global inventory with params:', params);
      
      // Use RPC function to bypass RLS
      const { data, error } = await supabase
        .rpc('get_global_inventory', {
          search_query: params.query || null,
          page_number: params.page || 1,
          page_size: params.limit || 20
        });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('Global inventory RPC result:', { data: data?.length });

      // Transform the RPC result to match WarehouseInventory interface
      const transformedInventory: WarehouseInventory[] = (data || []).map((item: any) => ({
        id: item.id,
        warehouse_id: item.warehouse_id,
        sku_id: item.sku_id,
        total_quantity: item.total_quantity,
        reserved_quantity: item.reserved_quantity,
        available_quantity: item.available_quantity,
        created_at: item.created_at,
        updated_at: item.updated_at,
        warehouse: {
          id: item.warehouse_id,
          name: item.warehouse_name,
          city: item.warehouse_city,
          state: item.warehouse_state
        },
        sku: {
          id: item.sku_id,
          sku_code: item.sku_code,
          class: {
            id: '', // We don't have this from RPC
            style: {
              id: '',
              name: item.style_name,
              brand: {
                id: '',
                name: item.brand_name
              }
            },
            color: {
              id: '',
              name: item.color_name
            }
          },
          size: {
            id: '',
            name: item.size_name
          }
        },
        locations: Array(item.location_count || 0).fill(null), // Create array with correct length for count display
        reservations: []
      }));

      return {
        inventory: transformedInventory,
        total: transformedInventory.length, // We'll need to get total count separately
        hasMore: (data?.length || 0) === (params.limit || 20)
      };
    } catch (error) {
      console.error('Error fetching global inventory:', error);
      throw new Error('Failed to fetch global inventory');
    }
  }

  // Get global inventory statistics
  async getGlobalInventoryStatistics(): Promise<InventoryStatistics> {
    try {
      console.log('Getting global inventory statistics');
      
      const { data, error } = await supabase
        .rpc('get_global_inventory_statistics');

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      const stats = data?.[0] || {};
      const total_items = Number(stats.total_items) || 0;
      const total_quantity = Number(stats.total_quantity) || 0;
      const reserved_quantity = Number(stats.reserved_quantity) || 0;
      const available_quantity = Number(stats.available_quantity) || 0;

      console.log('Global inventory statistics:', {
        total_items,
        total_quantity,
        reserved_quantity,
        available_quantity
      });

      return {
        total_items,
        total_quantity,
        reserved_quantity,
        available_quantity
      };
    } catch (error) {
      console.error('Error fetching global inventory statistics:', error);
      throw new Error('Failed to fetch global inventory statistics');
    }
  }

  // Get inventory locations for a specific inventory item
  async getInventoryLocations(inventoryId: string): Promise<WarehouseInventoryLocation[]> {
    try {
      console.log('Getting inventory locations for:', inventoryId);
      
      const { data, error } = await supabase
        .from('warehouse_inventory_locations')
        .select(`
          *,
          floor:warehouse_floors(*),
          lane:warehouse_lanes(*),
          rack:warehouse_racks(*)
        `)
        .eq('warehouse_inventory_id', inventoryId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data as WarehouseInventoryLocation[];
    } catch (error) {
      console.error('Error fetching inventory locations:', error);
      throw new Error('Failed to fetch inventory locations');
    }
  }

  // Export global inventory
  async exportGlobalInventory(): Promise<any[]> {
    try {
      console.log('Exporting global inventory');
      
      const { data: inventory, error } = await supabase
        .from('warehouse_inventory')
        .select(`
          *,
          warehouse:warehouses(
            id,
            name,
            city,
            state
          ),
          sku:skus(
            *,
            class:classes(
              *,
              style:styles(
                *,
                brand:brands(*)
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
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!inventory || inventory.length === 0) {
        return [];
      }

      // Transform data for export
      const exportData = inventory.map(item => {
        const sku = item.sku;
        const warehouse = item.warehouse;
        
        return {
          warehouse_name: warehouse?.name || 'N/A',
          warehouse_location: warehouse ? `${warehouse.city || ''}, ${warehouse.state || ''}`.trim() || 'N/A' : 'N/A',
          sku_code: sku?.sku_code || '',
          brand: sku?.class?.style?.brand?.name || '',
          product_name: sku?.class?.style?.name || '',
          color: sku?.class?.color?.name || '',
          size: sku?.size?.name || '',
          total_quantity: item.total_quantity || 0,
          reserved_quantity: item.reserved_quantity || 0,
          available_quantity: item.available_quantity || 0,
          created_at: item.created_at || ''
        };
      });

      console.log('Global export data prepared:', exportData.length, 'records');
      return exportData;
    } catch (error) {
      console.error('Error exporting global inventory:', error);
      throw new Error('Failed to export global inventory');
    }
  }

  // Search SKUs for adding inventory
  async searchSkus(query: string, limit: number = 10): Promise<any[]> {
    try {
      console.log('Starting SKU search with query:', query);
      
      // Try the simplest approach first - just get SKUs with basic info
      const { data: basicData, error: basicError } = await supabase
        .from('skus')
        .select('*')
        .ilike('sku_code', `%${query}%`)
        .limit(limit);

      if (basicError) {
        console.error('Error in basic SKU search:', basicError);
        throw basicError;
      }

      console.log('Basic SKU search results:', basicData);

      if (!basicData || basicData.length === 0) {
        // If no results by SKU code, get all SKUs and filter by brand/style name
        const { data: allSkus, error: allError } = await supabase
          .from('skus')
          .select('*')
          .limit(50); // Get more SKUs for client-side filtering

        if (allError) {
          console.error('Error fetching all SKUs:', allError);
          throw allError;
        }

        // For now, return basic SKU data without complex joins
        return allSkus?.slice(0, limit) || [];
      }

      // If we have basic results, try to get the related data
      try {
        const skuIds = basicData.map(sku => sku.id);
        const { data: fullData, error: fullError } = await supabase
          .from('skus')
          .select(`
            *,
            class:classes(
              *,
              style:styles(
                *,
                brand:brands(*)
              ),
              color:colors(*)
            ),
            size:sizes(*)
          `)
          .in('id', skuIds);

        if (fullError) {
          console.error('Error in full SKU search:', fullError);
          // Return basic data if full search fails
          return basicData;
        }

        return fullData || basicData;
      } catch (joinError) {
        console.error('Error in joined SKU search:', joinError);
        // Return basic data if join fails
        return basicData;
      }
    } catch (error) {
      console.error('Error searching SKUs:', error);
      throw new Error('Failed to search SKUs');
    }
  }
}

export const inventoryService = new InventoryService(); 
import { supabase } from '@/integrations/supabase/client';
import {
  WarehouseInventory,
  WarehouseInventoryLocation,
  WarehouseInventoryReservation,
  AddInventoryRequest,
  UpdateInventoryRequest,
  InventorySearchParams,
  InventorySearchResult,
  InventoryStatistics
} from '../types';

export class WarehouseInventoryService {
  // Get inventory for a specific warehouse
  async getWarehouseInventory(
    warehouseId: string,
    params: InventorySearchParams = {}
  ): Promise<InventorySearchResult> {
    try {
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
        console.error('Database error:', error);
        throw error;
      }

      return data as WarehouseInventory;
    } catch (error) {
      console.error('Error fetching inventory by ID:', error);
      throw new Error('Failed to fetch inventory');
    }
  }

  // Add new inventory
  async addInventory(request: AddInventoryRequest): Promise<WarehouseInventory> {
    try {
      // Check if inventory already exists for this SKU in this warehouse
      const { data: existingInventory } = await supabase
        .from('warehouse_inventory')
        .select('*')
        .eq('warehouse_id', request.warehouse_id)
        .eq('sku_id', request.sku_id)
        .single();

      let inventoryId: string;

      if (existingInventory) {
        // Update existing inventory
        inventoryId = existingInventory.id;
      } else {
        // Create new inventory
        const { data: inventory, error: inventoryError } = await supabase
          .from('warehouse_inventory')
          .insert({
            warehouse_id: request.warehouse_id,
            sku_id: request.sku_id,
            total_quantity: request.quantity,
            reserved_quantity: 0,
            created_by: request.created_by,
            updated_by: request.updated_by
          })
          .select()
          .single();

        if (inventoryError) {
          console.error('Error creating inventory:', inventoryError);
          throw inventoryError;
        }

        inventoryId = inventory.id;
      }

      // Handle locations
      if (request.locations && request.locations.length > 0) {
        for (const location of request.locations) {
          // Check if location already exists
          const { data: existingLocation } = await supabase
            .from('warehouse_inventory_locations')
            .select('*')
            .eq('warehouse_inventory_id', inventoryId)
            .eq('floor_id', location.floor_id)
            .eq('lane_id', location.lane_id)
            .eq('rack_id', location.rack_id)
            .single();

          if (existingLocation) {
            // Update existing location quantity
            const { error: updateError } = await supabase
              .from('warehouse_inventory_locations')
              .update({
                quantity: existingLocation.quantity + location.quantity,
                updated_at: new Date().toISOString(),
                updated_by: request.updated_by
              })
              .eq('id', existingLocation.id);

            if (updateError) {
              console.error('Error updating location quantity:', updateError);
              throw updateError;
            }
          } else {
            // Insert new location
            const { error: insertError } = await supabase
              .from('warehouse_inventory_locations')
              .insert({
                warehouse_inventory_id: inventoryId,
                floor_id: location.floor_id,
                lane_id: location.lane_id,
                rack_id: location.rack_id,
                quantity: location.quantity,
                created_by: request.created_by,
                updated_by: request.updated_by
              });

            if (insertError) {
              console.error('Error creating location:', insertError);
              throw insertError;
            }
          }
        }
      }

      // Return the updated inventory with all relations
      const result = await this.getInventoryById(inventoryId) as WarehouseInventory;
      return result;
    } catch (error) {
      console.error('Error adding inventory:', error);
      throw new Error('Failed to add inventory');
    }
  }

  // Update existing inventory
  async updateInventory(request: UpdateInventoryRequest): Promise<WarehouseInventory> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .update({
          total_quantity: request.total_quantity,
          available_quantity: request.available_quantity,
          reserved_quantity: request.reserved_quantity,
          damaged_quantity: request.damaged_quantity,
          updated_at: new Date().toISOString(),
          updated_by: request.updated_by
        })
        .eq('id', request.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating inventory:', error);
        throw error;
      }

      return data as WarehouseInventory;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Failed to update inventory');
    }
  }

  // Delete inventory
  async deleteInventory(inventoryId: string): Promise<void> {
    try {
      // First delete related records
      await supabase
        .from('warehouse_inventory_locations')
        .delete()
        .eq('warehouse_inventory_id', inventoryId);

      await supabase
        .from('warehouse_inventory_reservations')
        .delete()
        .eq('warehouse_inventory_id', inventoryId);

      // Then delete the inventory
      const { error } = await supabase
        .from('warehouse_inventory')
        .delete()
        .eq('id', inventoryId);

      if (error) {
        console.error('Error deleting inventory:', error);
        throw error;
      }
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
        .insert({
          warehouse_inventory_id: inventoryId,
          quantity,
          reservation_type: reservationType,
          order_id: orderId,
          notes,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding reservation:', error);
        throw error;
      }

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

      if (error) {
        console.error('Error updating reservation status:', error);
        throw error;
      }

      return data as WarehouseInventoryReservation;
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw new Error('Failed to update reservation status');
    }
  }

  // Get inventory statistics for a warehouse
  async getInventoryStatistics(warehouseId: string): Promise<InventoryStatistics> {
    try {
      const { data, error } = await supabase
        .from('warehouse_inventory')
        .select('total_quantity, available_quantity, reserved_quantity, damaged_quantity')
        .eq('warehouse_id', warehouseId);

      if (error) {
        console.error('Database error:', error);
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

  // Get inventory by rack
  async getInventoryByRack(rackId: string): Promise<WarehouseInventory[]> {
    try {
      // First, get all inventory locations for this rack
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_inventory_locations')
        .select('warehouse_inventory_id')
        .eq('rack_id', rackId);

      if (locationError) {
        console.error('Database error:', locationError);
        throw locationError;
      }

      if (!locationData || locationData.length === 0) {
        return [];
      }

      // Get inventory IDs
      const inventoryIds = locationData.map(loc => loc.warehouse_inventory_id);

      // Get full inventory data for these IDs
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
        console.error('Database error:', inventoryError);
        throw inventoryError;
      }

      return inventoryData as WarehouseInventory[];
    } catch (error) {
      console.error('Error fetching inventory by rack:', error);
      throw new Error('Failed to fetch inventory by rack');
    }
  }
}

export const warehouseInventoryService = new WarehouseInventoryService();

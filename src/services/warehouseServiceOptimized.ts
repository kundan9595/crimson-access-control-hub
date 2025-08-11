import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  address?: string;
  status: string;
  is_primary?: boolean;
  warehouse_admin_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface WarehouseFloor {
  id: string;
  warehouse_id: string;
  name: string;
  floor_number: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLane {
  id: string;
  floor_id: string;
  name: string;
  lane_number: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseRack {
  id: string;
  lane_id: string;
  rack_name: string;
  rack_number: number;
  side: 'left' | 'right';
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LaneConfig {
  id: string;
  lane_id: string;
  left_side_enabled: boolean;
  right_side_enabled: boolean;
  default_direction: 'left' | 'right';
  created_at: string;
  updated_at: string;
}

export interface WarehouseWithDetails extends Warehouse {
  floors: Array<WarehouseFloor & {
    lanes: Array<WarehouseLane & {
      config?: LaneConfig;
      racks: WarehouseRack[];
    }>;
  }>;
}

export interface CreateWarehouseData {
  warehouse: {
    name: string;
    description?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    address?: string;
    status?: string;
    is_primary?: boolean;
    warehouse_admin_id?: string;
  };
  floors: Array<{
    name: string;
    floor_number: number;
    description?: string;
  }>;
  lanes: Array<{
    name: string;
    lane_number: number;
    floor_number: number;
    description?: string;
    config: {
      left_side_enabled: boolean;
      right_side_enabled: boolean;
      default_direction: 'left' | 'right';
      default_left_racks: number;
      default_right_racks: number;
    };
    racks: Array<{
      side: 'left' | 'right';
      rack_name: string;
      rack_number: number;
    }>;
  }>;
}

export interface UpdateWarehouseData {
  name?: string;
  description?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  address?: string;
  status?: string;
  is_primary?: boolean;
  warehouse_admin_id?: string;
}

export interface WarehouseFilters {
  status?: 'active' | 'inactive' | 'all';
  city?: string;
  state?: string;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Cache implementation
class WarehouseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Optimized Warehouse Service
class WarehouseServiceOptimized {
  private cache = new WarehouseCache();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get current user ID
  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }

  // Get warehouses with pagination and filtering
  async getWarehouses(
    filters: WarehouseFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ warehouses: Warehouse[]; total: number; hasMore: boolean }> {
    const cacheKey = `warehouses:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('warehouses')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters.state) {
        query = query.ilike('state', `%${filters.state}%`);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination and sorting
      const offset = (pagination.page - 1) * pagination.limit;
      query = query
        .range(offset, offset + pagination.limit - 1)
        .order(pagination.sortBy || 'name', { ascending: pagination.sortOrder !== 'desc' });

      const { data: warehouses, error, count } = await query;

      if (error) throw error;

      const result = {
        warehouses: warehouses || [],
        total: count || 0,
        hasMore: (count || 0) > offset + pagination.limit
      };

      this.cache.set(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('Failed to fetch warehouses');
    }
  }

  // Get warehouse by ID with full details
  async getWarehouseById(id: string): Promise<WarehouseWithDetails | null> {
    const cacheKey = `warehouse:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached as WarehouseWithDetails;

    try {
      const { data: warehouse, error } = await supabase
        .from('warehouses')
        .select(`
          *,
          floors:warehouse_floors(
            *,
            lanes:warehouse_lanes(
              *,
              config:warehouse_lane_configs(*),
              racks:warehouse_racks(*)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Transform the data to match the expected structure
      const transformedWarehouse = {
        ...warehouse,
        floors: warehouse.floors?.map((floor: any) => ({
          ...floor,
          lanes: floor.lanes?.map((lane: any) => ({
            ...lane,
            config: lane.config || {
              left_side_enabled: true,
              right_side_enabled: true,
              default_direction: 'left',
              default_left_racks: 4,
              default_right_racks: 4
            },
            racks: lane.racks?.map((rack: any) => ({
              ...rack,
              // Ensure rack enablement is properly set based on lane config
              is_enabled: rack.is_enabled !== undefined ? rack.is_enabled : 
                (rack.side === 'left' ? 
                  (lane.config?.left_side_enabled ?? true) : 
                  (lane.config?.right_side_enabled ?? true))
            })) || []
          })) || []
        })) || []
      };

      this.cache.set(cacheKey, transformedWarehouse, this.CACHE_TTL);
      return transformedWarehouse as WarehouseWithDetails;
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      throw new Error('Failed to fetch warehouse details');
    }
  }

  // Check if primary warehouse feature is available
  async isPrimaryWarehouseFeatureAvailable(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('is_primary')
        .limit(1);

      if (error) {
        // Primary warehouse feature check error
        return false;
      }

      // Primary warehouse feature is available
      return true;
    } catch (error) {
              // Primary warehouse feature not available
      return false;
    }
  }

  // Set warehouse as primary
  async setPrimaryWarehouse(id: string): Promise<Warehouse> {
    try {
      // Setting warehouse as primary
      
      // First, manually set all other warehouses to not primary
      // This is a fallback in case the database trigger isn't working
      const { error: resetError } = await supabase
        .from('warehouses')
        .update({ 
          is_primary: false
        } as any)
        .neq('id', id);

      if (resetError) {
        console.error('Error resetting other warehouses:', resetError);
        // Don't throw here, continue with setting the primary warehouse
      }
      
      // Then set the selected warehouse as primary
      const { data, error } = await supabase
        .from('warehouses')
        .update({ 
          is_primary: true
        } as any)
        .eq('id', id)
        .select('*')
        .single();

              // Update result

      if (error) {
        console.error('Supabase error:', error);
        // Check if the error is due to missing column
        if (error.message?.includes('column "is_primary" does not exist')) {
          throw new Error('Primary warehouse feature is not yet available. Please run the database migration first.');
        }
        throw error;
      }

      if (!data) {
        throw new Error('No warehouse returned after update');
      }

              // Successfully set warehouse as primary

      // Clear cache to reflect changes
      this.cache.invalidatePattern('warehouses:*');
      this.cache.delete(`warehouse:${id}`);
      
      // Also clear any related cache entries
      this.cache.clear();

      return data as Warehouse;
    } catch (error) {
      console.error('Error setting primary warehouse:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to set primary warehouse');
    }
  }

  // Get primary warehouse
  async getPrimaryWarehouse(): Promise<Warehouse | null> {
    try {
      const { data: warehouse, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_primary', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        // Check if the error is due to missing column
        if (error.message?.includes('column "is_primary" does not exist')) {
          console.warn('Primary warehouse feature is not available - column does not exist');
          return null;
        }
        throw error;
      }

      return warehouse;
    } catch (error) {
      console.error('Error fetching primary warehouse:', error);
      throw new Error('Failed to fetch primary warehouse');
    }
  }

  // Update warehouse admin
  async updateWarehouseAdmin(warehouseId: string, adminId: string | null): Promise<Warehouse> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { data, error } = await supabase
        .from('warehouses')
        .update({ 
          warehouse_admin_id: adminId,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', warehouseId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Warehouse not found');
      }

      // Clear cache to reflect changes
      this.cache.invalidatePattern('warehouses:*');
      this.cache.delete(`warehouse:${warehouseId}`);
      
      return data as Warehouse;
    } catch (error) {
      console.error('Error updating warehouse admin:', error);
      throw new Error('Failed to update warehouse admin');
    }
  }



  // Create warehouse with full hierarchy
  async createWarehouse(data: CreateWarehouseData): Promise<WarehouseWithDetails> {
    try {
      const userId = await this.getCurrentUserId();

      // Start transaction
      const { data: warehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .insert({
          ...data.warehouse,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (warehouseError) {
        console.error('Warehouse creation error:', warehouseError);
        throw new Error(`Failed to create warehouse: ${warehouseError.message}`);
      }

      // Create floors
      const createdFloors: any[] = [];
      for (const floorData of data.floors) {
        const { data: floor, error: floorError } = await supabase
          .from('warehouse_floors')
          .insert({
            warehouse_id: warehouse.id,
            name: floorData.name,
            floor_number: floorData.floor_number,
            created_by: userId,
            updated_by: userId
          })
          .select()
          .single();

        if (floorError) {
          console.error('Floor creation error:', floorError);
          throw new Error(`Failed to create floor: ${floorError.message}`);
        }

        createdFloors.push(floor);
      }

      // Create lanes for each floor
      for (const floor of createdFloors) {
        // Find lanes for this floor
        const floorLanes = data.lanes.filter(lane => lane.floor_number === floor.floor_number);
        
        for (const laneData of floorLanes) {
          // Create lane
          const { data: lane, error: laneError } = await supabase
            .from('warehouse_lanes')
            .insert({
              warehouse_id: warehouse.id,
              floor_id: floor.id,
              name: laneData.name,
              lane_number: laneData.lane_number,
              created_by: userId,
              updated_by: userId
            })
            .select()
            .single();

          if (laneError) {
            console.error('Lane creation error:', laneError);
            throw new Error(`Failed to create lane: ${laneError.message}`);
          }

          // Create lane configuration
          const { error: configError } = await supabase
            .from('warehouse_lane_configs')
            .insert({
              lane_id: lane.id,
              left_side_enabled: laneData.config.left_side_enabled,
              right_side_enabled: laneData.config.right_side_enabled,
              default_direction: laneData.config.default_direction,
              default_left_racks: laneData.config.default_left_racks,
              default_right_racks: laneData.config.default_right_racks,
              created_by: userId,
              updated_by: userId
            });

          if (configError) {
            console.error('Lane config creation error:', configError);
            throw new Error(`Failed to create lane configuration: ${configError.message}`);
          }

          // Create racks
          for (const rackData of laneData.racks) {
            const { error: rackError } = await supabase
              .from('warehouse_racks')
              .insert({
                lane_id: lane.id,
                rack_name: rackData.rack_name,
                rack_number: rackData.rack_number,
                side: rackData.side,
                is_enabled: rackData.side === 'left' ? laneData.config.left_side_enabled : laneData.config.right_side_enabled,
                created_by: userId,
                updated_by: userId
              });

            if (rackError) {
              console.error('Rack creation error:', rackError);
              throw new Error(`Failed to create rack: ${rackError.message}`);
            }
          }
        }
      }

      // Clear all warehouse-related cache to ensure fresh data
      this.cache.clear();
      this.cache.invalidatePattern('warehouses');
      this.cache.invalidatePattern('warehouse');

      // Return the created warehouse with details
      const result = await this.getWarehouseById(warehouse.id);
      if (!result) {
        throw new Error('Failed to retrieve created warehouse');
      }
      
      return result;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      // If it's already an Error instance, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it in an Error
      throw new Error('Failed to create warehouse');
    }
  }

  // Update warehouse with full hierarchy
  async updateWarehouse(id: string, data: CreateWarehouseData): Promise<WarehouseWithDetails> {
    try {
      const userId = await this.getCurrentUserId();

      // Update main warehouse
      const { error: warehouseError } = await supabase
        .from('warehouses')
        .update({
          ...data.warehouse,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (warehouseError) {
        console.error('Warehouse update error:', warehouseError);
        throw new Error(`Failed to update warehouse: ${warehouseError.message}`);
      }

      // Get existing warehouse structure
      const existingWarehouse = await this.getWarehouseById(id);
      if (!existingWarehouse) {
        throw new Error('Failed to retrieve existing warehouse');
      }

      // Get current floor numbers and lane numbers from the data
      const currentFloorNumbers = data.floors.map(f => f.floor_number);
      const currentLaneNumbers = data.lanes.map(l => ({ floor: l.floor_number, lane: l.lane_number }));

      // Delete floors that are no longer present
      for (const existingFloor of existingWarehouse.floors) {
        if (!currentFloorNumbers.includes(existingFloor.floor_number)) {
          // Delete all lanes and racks for this floor first
          for (const lane of existingFloor.lanes) {
            // Delete racks for this lane
            const { error: deleteRacksError } = await supabase
              .from('warehouse_racks')
              .delete()
              .eq('lane_id', lane.id);

            if (deleteRacksError) {
              console.error('Rack deletion error:', deleteRacksError);
              throw new Error(`Failed to delete racks for lane ${lane.id}: ${deleteRacksError.message}`);
            }

            // Delete lane config
            const { error: deleteConfigError } = await supabase
              .from('warehouse_lane_configs')
              .delete()
              .eq('lane_id', lane.id);

            if (deleteConfigError) {
              console.error('Lane config deletion error:', deleteConfigError);
              throw new Error(`Failed to delete lane config for lane ${lane.id}: ${deleteConfigError.message}`);
            }

            // Delete the lane
            const { error: deleteLaneError } = await supabase
              .from('warehouse_lanes')
              .delete()
              .eq('id', lane.id);

            if (deleteLaneError) {
              console.error('Lane deletion error:', deleteLaneError);
              throw new Error(`Failed to delete lane ${lane.id}: ${deleteLaneError.message}`);
            }
          }

          // Delete the floor
          const { error: deleteFloorError } = await supabase
            .from('warehouse_floors')
            .delete()
            .eq('id', existingFloor.id);

          if (deleteFloorError) {
            console.error('Floor deletion error:', deleteFloorError);
            throw new Error(`Failed to delete floor ${existingFloor.id}: ${deleteFloorError.message}`);
          }
        }
      }

      // Update floors
      for (const floorData of data.floors) {
        const existingFloor = existingWarehouse.floors.find(f => f.floor_number === floorData.floor_number);
        
        if (existingFloor) {
          // Update existing floor
          const { error: floorError } = await supabase
            .from('warehouse_floors')
            .update({
              name: floorData.name,
              updated_by: userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFloor.id);

          if (floorError) {
            console.error('Floor update error:', floorError);
            throw new Error(`Failed to update floor: ${floorError.message}`);
          }
        } else {
          // Create new floor
          const { error: floorError } = await supabase
            .from('warehouse_floors')
            .insert({
              warehouse_id: id,
              name: floorData.name,
              floor_number: floorData.floor_number,
              created_by: userId,
              updated_by: userId
            });

          if (floorError) {
            console.error('Floor creation error:', floorError);
            throw new Error(`Failed to create floor: ${floorError.message}`);
          }
        }
      }

      // Get updated warehouse structure
      const updatedWarehouse = await this.getWarehouseById(id);
      if (!updatedWarehouse) {
        throw new Error('Failed to retrieve updated warehouse');
      }

      // Delete lanes that are no longer present
      for (const floor of updatedWarehouse.floors) {
        for (const lane of floor.lanes) {
          const isLanePresent = currentLaneNumbers.some(
            l => l.floor === floor.floor_number && l.lane === lane.lane_number
          );

          if (!isLanePresent) {
            // Delete racks for this lane
            const { error: deleteRacksError } = await supabase
              .from('warehouse_racks')
              .delete()
              .eq('lane_id', lane.id);

            if (deleteRacksError) {
              console.error('Rack deletion error:', deleteRacksError);
              throw new Error(`Failed to delete racks for lane ${lane.id}: ${deleteRacksError.message}`);
            }

            // Delete lane config
            const { error: deleteConfigError } = await supabase
              .from('warehouse_lane_configs')
              .delete()
              .eq('lane_id', lane.id);

            if (deleteConfigError) {
              console.error('Lane config deletion error:', deleteConfigError);
              throw new Error(`Failed to delete lane config for lane ${lane.id}: ${deleteConfigError.message}`);
            }

            // Delete the lane
            const { error: deleteLaneError } = await supabase
              .from('warehouse_lanes')
              .delete()
              .eq('id', lane.id);

            if (deleteLaneError) {
              console.error('Lane deletion error:', deleteLaneError);
              throw new Error(`Failed to delete lane ${lane.id}: ${deleteLaneError.message}`);
            }
          }
        }
      }

      // Update lanes and racks
      for (const laneData of data.lanes) {
        const existingFloor = updatedWarehouse.floors.find(f => f.floor_number === laneData.floor_number);
        if (!existingFloor) {
          console.warn(`Floor ${laneData.floor_number} not found for lane ${laneData.name}`);
          continue;
        }

        const existingLane = existingFloor.lanes.find(l => l.lane_number === laneData.lane_number);
        
        if (existingLane) {
          // Update existing lane
          const { error: laneError } = await supabase
            .from('warehouse_lanes')
            .update({
              name: laneData.name,
              updated_by: userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingLane.id);

          if (laneError) {
            console.error('Lane update error:', laneError);
            throw new Error(`Failed to update lane: ${laneError.message}`);
          }

          // Update lane configuration
          const { error: configError } = await supabase
            .from('warehouse_lane_configs')
            .update({
              left_side_enabled: laneData.config.left_side_enabled,
              right_side_enabled: laneData.config.right_side_enabled,
              default_direction: laneData.config.default_direction,
              default_left_racks: laneData.config.default_left_racks,
              default_right_racks: laneData.config.default_right_racks,
              updated_by: userId,
              updated_at: new Date().toISOString()
            })
            .eq('lane_id', existingLane.id);

          if (configError) {
            console.error('Lane config update error:', configError);
            throw new Error(`Failed to update lane configuration: ${configError.message}`);
          }

          // Delete existing racks
          const { error: deleteRacksError } = await supabase
            .from('warehouse_racks')
            .delete()
            .eq('lane_id', existingLane.id);

          if (deleteRacksError) {
            console.error('Rack deletion error:', deleteRacksError);
            throw new Error(`Failed to delete existing racks: ${deleteRacksError.message}`);
          }

          // Create new racks
          for (const rackData of laneData.racks) {
            const { error: rackError } = await supabase
              .from('warehouse_racks')
              .insert({
                lane_id: existingLane.id,
                rack_name: rackData.rack_name,
                rack_number: rackData.rack_number,
                side: rackData.side,
                is_enabled: rackData.side === 'left' ? laneData.config.left_side_enabled : laneData.config.right_side_enabled,
                created_by: userId,
                updated_by: userId
              });

            if (rackError) {
              console.error('Rack creation error:', rackError);
              throw new Error(`Failed to create rack: ${rackError.message}`);
            }
          }
        } else {
          // Create new lane
          const { data: newLane, error: laneError } = await supabase
            .from('warehouse_lanes')
            .insert({
              warehouse_id: id,
              floor_id: existingFloor.id,
              name: laneData.name,
              lane_number: laneData.lane_number,
              created_by: userId,
              updated_by: userId
            })
            .select()
            .single();

          if (laneError) {
            console.error('Lane creation error:', laneError);
            throw new Error(`Failed to create lane: ${laneError.message}`);
          }

          // Create lane configuration
          const { error: configError } = await supabase
            .from('warehouse_lane_configs')
            .insert({
              lane_id: newLane.id,
              left_side_enabled: laneData.config.left_side_enabled,
              right_side_enabled: laneData.config.right_side_enabled,
              default_direction: laneData.config.default_direction,
              default_left_racks: laneData.config.default_left_racks,
              default_right_racks: laneData.config.default_right_racks,
              created_by: userId,
              updated_by: userId
            });

          if (configError) {
            console.error('Lane config creation error:', configError);
            throw new Error(`Failed to create lane configuration: ${configError.message}`);
          }

          // Create racks
          for (const rackData of laneData.racks) {
            const { error: rackError } = await supabase
              .from('warehouse_racks')
              .insert({
                lane_id: newLane.id,
                rack_name: rackData.rack_name,
                rack_number: rackData.rack_number,
                side: rackData.side,
                is_enabled: rackData.side === 'left' ? laneData.config.left_side_enabled : laneData.config.right_side_enabled,
                created_by: userId,
                updated_by: userId
              });

            if (rackError) {
              console.error('Rack creation error:', rackError);
              throw new Error(`Failed to create rack: ${rackError.message}`);
            }
          }
        }
      }

      // Invalidate cache
      this.cache.delete(`warehouse:${id}`);
      this.cache.invalidatePattern('warehouses');

      // Return updated warehouse
      const result = await this.getWarehouseById(id);
      if (!result) {
        throw new Error('Failed to retrieve updated warehouse');
      }
      
      return result;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update warehouse');
    }
  }

  // Delete warehouse with cascade
  async deleteWarehouse(id: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();

      // Try to use the optimized RPC function first
      const { error: rpcError } = await supabase.rpc('delete_warehouse_cascade', {
        warehouse_id: id,
        user_id: userId
      });

      if (rpcError) {
        console.warn('RPC function failed, falling back to manual deletion:', rpcError);
        await this.deleteWarehouseManually(id, userId);
      }

      // Invalidate cache
      this.cache.invalidatePattern('warehouses');
      this.cache.invalidatePattern('warehouse');
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw new Error('Failed to delete warehouse');
    }
  }

  // Manual deletion fallback
  private async deleteWarehouseManually(warehouseId: string, userId: string): Promise<void> {
    try {
      // Get all floors for this warehouse
      const { data: floors } = await supabase
        .from('warehouse_floors')
        .select('id')
        .eq('warehouse_id', warehouseId);

      if (floors && floors.length > 0) {
        const floorIds = floors.map(floor => floor.id);

        // Get all lanes for these floors
        const { data: lanes } = await supabase
          .from('warehouse_lanes')
          .select('id')
          .in('floor_id', floorIds);

        if (lanes && lanes.length > 0) {
          const laneIds = lanes.map(lane => lane.id);

          // Delete all racks for these lanes
          await supabase
            .from('warehouse_racks')
            .delete()
            .in('lane_id', laneIds);

          // Delete all lane configurations
          await supabase
            .from('warehouse_lane_configs')
            .delete()
            .in('lane_id', laneIds);

          // Delete all lanes
          await supabase
            .from('warehouse_lanes')
            .delete()
            .in('id', laneIds);
        }

        // Delete all floors
        await supabase
          .from('warehouse_floors')
          .delete()
          .in('id', floorIds);
      }

      // Remove warehouse from zone assignments
      const { data: zonesWithWarehouse } = await supabase
        .from('zones')
        .select('id, warehouse_assignments')
        .contains('warehouse_assignments', [warehouseId]);

      if (zonesWithWarehouse) {
        for (const zone of zonesWithWarehouse) {
          const currentAssignments = zone.warehouse_assignments as string[] || [];
          const updatedAssignments = currentAssignments.filter((assignment: string) => assignment !== warehouseId);
          
          await supabase
            .from('zones')
            .update({
              warehouse_assignments: updatedAssignments,
              updated_by: userId
            })
            .eq('id', zone.id);
        }
      }

      // Finally, delete the warehouse itself
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting warehouse manually:', error);
      throw new Error('Failed to delete warehouse manually');
    }
  }

  // Search warehouses
  async searchWarehouses(query: string, limit: number = 10): Promise<Warehouse[]> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data: warehouses, error } = await supabase
        .from('warehouses')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(limit)
        .order('name');

      if (error) throw error;

      this.cache.set(cacheKey, warehouses || [], 2 * 60 * 1000); // 2 minutes cache for search
      return warehouses || [];
    } catch (error) {
      console.error('Error searching warehouses:', error);
      throw new Error('Failed to search warehouses');
    }
  }

  // Get warehouse statistics
  async getWarehouseStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCity: Record<string, number>;
    byState: Record<string, number>;
  }> {
    const cacheKey = 'warehouse:statistics';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data: warehouses, error } = await supabase
        .from('warehouses')
        .select('status, city, state');

      if (error) throw error;

      const stats = {
        total: warehouses.length,
        active: warehouses.filter(w => w.status === 'active').length,
        inactive: warehouses.filter(w => w.status === 'inactive').length,
        byCity: {} as Record<string, number>,
        byState: {} as Record<string, number>
      };

      warehouses.forEach(warehouse => {
        if (warehouse.city) {
          stats.byCity[warehouse.city] = (stats.byCity[warehouse.city] || 0) + 1;
        }
        if (warehouse.state) {
          stats.byState[warehouse.state] = (stats.byState[warehouse.state] || 0) + 1;
        }
      });

      this.cache.set(cacheKey, stats, 10 * 60 * 1000); // 10 minutes cache for statistics
      return stats;
    } catch (error) {
      console.error('Error fetching warehouse statistics:', error);
      throw new Error('Failed to fetch warehouse statistics');
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Invalidate specific cache entries
  invalidateCache(pattern: string): void {
    this.cache.invalidatePattern(pattern);
  }
}

// Export singleton instance
export const warehouseServiceOptimized = new WarehouseServiceOptimized(); 
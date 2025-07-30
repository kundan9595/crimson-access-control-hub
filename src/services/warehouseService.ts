import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type definitions
type Warehouse = Database['public']['Tables']['warehouses']['Row'];
type WarehouseInsert = Database['public']['Tables']['warehouses']['Insert'];
type WarehouseUpdate = Database['public']['Tables']['warehouses']['Update'];

type WarehouseFloor = Database['public']['Tables']['warehouse_floors']['Row'];
type WarehouseFloorInsert = Database['public']['Tables']['warehouse_floors']['Insert'];
type WarehouseFloorUpdate = Database['public']['Tables']['warehouse_floors']['Update'];

type WarehouseLane = Database['public']['Tables']['warehouse_lanes']['Row'];
type WarehouseLaneInsert = Database['public']['Tables']['warehouse_lanes']['Insert'];
type WarehouseLaneUpdate = Database['public']['Tables']['warehouse_lanes']['Update'];

type WarehouseRack = Database['public']['Tables']['warehouse_racks']['Row'];
type WarehouseRackInsert = Database['public']['Tables']['warehouse_racks']['Insert'];
type WarehouseRackUpdate = Database['public']['Tables']['warehouse_racks']['Update'];

type WarehouseLaneConfig = Database['public']['Tables']['warehouse_lane_configs']['Row'];
type WarehouseLaneConfigInsert = Database['public']['Tables']['warehouse_lane_configs']['Insert'];
type WarehouseLaneConfigUpdate = Database['public']['Tables']['warehouse_lane_configs']['Update'];

// Extended types with relationships
export interface WarehouseWithDetails extends Warehouse {
  floors: WarehouseFloorWithDetails[];
  floors_count: number;
  lanes_count: number;
  racks_count: number;
}

export interface WarehouseFloorWithDetails extends WarehouseFloor {
  lanes: WarehouseLaneWithDetails[];
  lanes_count: number;
}

export interface WarehouseLaneWithDetails extends WarehouseLane {
  racks: WarehouseRack[];
  config: WarehouseLaneConfig | null;
  racks_count: number;
}

// Data structure for creating warehouses
export interface CreateWarehouseData {
  warehouse: {
    name: string;
    description?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    address?: string;
    status?: string;
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

// Data structure for updating warehouses
export interface UpdateWarehouseData extends CreateWarehouseData {
  warehouse: WarehouseUpdate;
}

class WarehouseService {
  // Get all warehouses with full details
  async getWarehouses(): Promise<WarehouseWithDetails[]> {
    try {
      const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (warehouseError) throw warehouseError;

      if (!warehouses) return [];

      // Get detailed data for each warehouse
      const warehousesWithDetails = await Promise.all(
        warehouses.map(async (warehouse) => {
          const floors = await this.getFloorsByWarehouseId(warehouse.id);
          const totalLanes = floors.reduce((sum, floor) => sum + floor.lanes_count, 0);
          const totalRacks = floors.reduce((sum, floor) => 
            sum + floor.lanes.reduce((laneSum, lane) => laneSum + lane.racks_count, 0), 0
          );

          return {
            ...warehouse,
            floors,
            floors_count: floors.length,
            lanes_count: totalLanes,
            racks_count: totalRacks
          };
        })
      );

      return warehousesWithDetails;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      throw new Error('Failed to fetch warehouses');
    }
  }

  // Get single warehouse with full details
  async getWarehouseById(id: string): Promise<WarehouseWithDetails | null> {
    try {
      const { data: warehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();

      if (warehouseError) throw warehouseError;
      if (!warehouse) return null;

      const floors = await this.getFloorsByWarehouseId(id);
      const totalLanes = floors.reduce((sum, floor) => sum + floor.lanes_count, 0);
      const totalRacks = floors.reduce((sum, floor) => 
        sum + floor.lanes.reduce((laneSum, lane) => laneSum + lane.racks_count, 0), 0
      );

      return {
        ...warehouse,
        floors,
        floors_count: floors.length,
        lanes_count: totalLanes,
        racks_count: totalRacks
      };
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      throw new Error('Failed to fetch warehouse');
    }
  }

  // Create new warehouse with complete structure
  async createWarehouse(data: CreateWarehouseData): Promise<WarehouseWithDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create warehouse
      const { data: warehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .insert({
          ...data.warehouse,
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (warehouseError) throw warehouseError;

      // Create floors
      for (const floorData of data.floors) {
        const { data: floor, error: floorError } = await supabase
          .from('warehouse_floors')
          .insert({
            warehouse_id: warehouse.id,
            name: floorData.name,
            floor_number: floorData.floor_number,
            description: floorData.description,
            status: 'active',
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (floorError) throw floorError;

        // Create lanes for this floor
        const floorLanes = data.lanes.filter(lane => lane.floor_number === floorData.floor_number);
        for (const laneData of floorLanes) {
          const { data: lane, error: laneError } = await supabase
            .from('warehouse_lanes')
            .insert({
              warehouse_id: warehouse.id,
              floor_id: floor.id,
              name: laneData.name,
              lane_number: laneData.lane_number,
              description: laneData.description,
              status: 'active',
              created_by: user.id,
              updated_by: user.id
            })
            .select()
            .single();

          if (laneError) throw laneError;

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
              created_by: user.id,
              updated_by: user.id
            });

          if (configError) throw configError;

          // Create racks for this lane
          for (const rackData of laneData.racks) {
            const { error: rackError } = await supabase
              .from('warehouse_racks')
              .insert({
                lane_id: lane.id,
                side: rackData.side,
                rack_name: rackData.rack_name,
                rack_number: rackData.rack_number,
                is_enabled: true,
                status: 'active',
                created_by: user.id,
                updated_by: user.id
              });

            if (rackError) throw rackError;
          }
        }
      }

      // Return the complete warehouse with details
      return this.getWarehouseById(warehouse.id) as Promise<WarehouseWithDetails>;
    } catch (error) {
      console.error('Error creating warehouse:', error);
      throw new Error('Failed to create warehouse');
    }
  }

  // Update warehouse with complete structure
  async updateWarehouse(id: string, data: UpdateWarehouseData): Promise<WarehouseWithDetails> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update warehouse basic info
      const { data: warehouse, error: warehouseError } = await supabase
        .from('warehouses')
        .update({
          ...data.warehouse,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (warehouseError) throw warehouseError;

      // Delete existing structure (cascade will handle related records)
      await supabase.from('warehouse_floors').delete().eq('warehouse_id', id);

      // Recreate the complete structure
      for (const floorData of data.floors) {
        const { data: floor, error: floorError } = await supabase
          .from('warehouse_floors')
          .insert({
            warehouse_id: id,
            name: floorData.name,
            floor_number: floorData.floor_number,
            description: floorData.description,
            status: 'active',
            created_by: user.id,
            updated_by: user.id
          })
          .select()
          .single();

        if (floorError) throw floorError;

        // Create lanes for this floor
        const floorLanes = data.lanes.filter(lane => lane.floor_number === floorData.floor_number);
        for (const laneData of floorLanes) {
          const { data: lane, error: laneError } = await supabase
            .from('warehouse_lanes')
            .insert({
              warehouse_id: id,
              floor_id: floor.id,
              name: laneData.name,
              lane_number: laneData.lane_number,
              description: laneData.description,
              status: 'active',
              created_by: user.id,
              updated_by: user.id
            })
            .select()
            .single();

          if (laneError) throw laneError;

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
              created_by: user.id,
              updated_by: user.id
            });

          if (configError) throw configError;

          // Create racks for this lane
          for (const rackData of laneData.racks) {
            const { error: rackError } = await supabase
              .from('warehouse_racks')
              .insert({
                lane_id: lane.id,
                side: rackData.side,
                rack_name: rackData.rack_name,
                rack_number: rackData.rack_number,
                is_enabled: true,
                status: 'active',
                created_by: user.id,
                updated_by: user.id
              });

            if (rackError) throw rackError;
          }
        }
      }

      // Return the updated warehouse with details
      return this.getWarehouseById(id) as Promise<WarehouseWithDetails>;
    } catch (error) {
      console.error('Error updating warehouse:', error);
      throw new Error('Failed to update warehouse');
    }
  }

  // Delete warehouse and all related data (hard delete)
  async deleteWarehouse(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Try to use the database function first for better performance
      const { error: functionError } = await supabase.rpc('delete_warehouse_cascade', {
        warehouse_id: id,
        user_id: user.id
      });

      if (functionError) {
        // Fall back to manual deletion if the function fails
        console.warn('Database function failed, using manual deletion:', functionError);
        await this.deleteWarehouseManually(id, user.id);
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      throw new Error('Failed to delete warehouse');
    }
  }

  // Manual deletion method as fallback
  private async deleteWarehouseManually(warehouseId: string, userId: string): Promise<void> {
    try {
      // 1. Get all floors for this warehouse
      const { data: floors } = await supabase
        .from('warehouse_floors')
        .select('id')
        .eq('warehouse_id', warehouseId);

      if (floors && floors.length > 0) {
        const floorIds = floors.map(floor => floor.id);

        // 2. Get all lanes for these floors
        const { data: lanes } = await supabase
          .from('warehouse_lanes')
          .select('id')
          .in('floor_id', floorIds);

        if (lanes && lanes.length > 0) {
          const laneIds = lanes.map(lane => lane.id);

          // 3. Delete all racks for these lanes
          await supabase
            .from('warehouse_racks')
            .delete()
            .in('lane_id', laneIds);

          // 4. Delete all lane configurations
          await supabase
            .from('warehouse_lane_configs')
            .delete()
            .in('lane_id', laneIds);

          // 5. Delete all lanes
          await supabase
            .from('warehouse_lanes')
            .delete()
            .in('id', laneIds);
        }

        // 6. Delete all floors
        await supabase
          .from('warehouse_floors')
          .delete()
          .in('id', floorIds);
      }

      // 7. Remove warehouse from zone assignments
      // First get zones that contain this warehouse
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

      // 8. Finally, delete the warehouse
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', warehouseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error in manual warehouse deletion:', error);
      throw error;
    }
  }

  // Get floors for a warehouse
  async getFloorsByWarehouseId(warehouseId: string): Promise<WarehouseFloorWithDetails[]> {
    try {
      const { data: floors, error: floorsError } = await supabase
        .from('warehouse_floors')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .eq('status', 'active')
        .order('floor_number', { ascending: true });

      if (floorsError) throw floorsError;

      if (!floors) return [];

      // Get lanes for each floor
      const floorsWithDetails = await Promise.all(
        floors.map(async (floor) => {
          const lanes = await this.getLanesByFloorId(floor.id);
          return {
            ...floor,
            lanes,
            lanes_count: lanes.length
          };
        })
      );

      return floorsWithDetails;
    } catch (error) {
      console.error('Error fetching floors:', error);
      throw new Error('Failed to fetch floors');
    }
  }

  // Get lanes for a floor
  async getLanesByFloorId(floorId: string): Promise<WarehouseLaneWithDetails[]> {
    try {
      const { data: lanes, error: lanesError } = await supabase
        .from('warehouse_lanes')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active')
        .order('lane_number', { ascending: true });

      if (lanesError) throw lanesError;

      if (!lanes) return [];

      // Get racks and config for each lane
      const lanesWithDetails = await Promise.all(
        lanes.map(async (lane) => {
          const [racks, config] = await Promise.all([
            this.getRacksByLaneId(lane.id),
            this.getLaneConfig(lane.id)
          ]);

          return {
            ...lane,
            racks,
            config,
            racks_count: racks.length
          };
        })
      );

      return lanesWithDetails;
    } catch (error) {
      console.error('Error fetching lanes:', error);
      throw new Error('Failed to fetch lanes');
    }
  }

  // Get racks for a lane
  async getRacksByLaneId(laneId: string): Promise<WarehouseRack[]> {
    try {
      const { data: racks, error: racksError } = await supabase
        .from('warehouse_racks')
        .select('*')
        .eq('lane_id', laneId)
        .eq('status', 'active')
        .order('side', { ascending: true })
        .order('rack_number', { ascending: true });

      if (racksError) throw racksError;
      return racks || [];
    } catch (error) {
      console.error('Error fetching racks:', error);
      throw new Error('Failed to fetch racks');
    }
  }

  // Get lane configuration
  async getLaneConfig(laneId: string): Promise<WarehouseLaneConfig | null> {
    try {
      const { data: config, error: configError } = await supabase
        .from('warehouse_lane_configs')
        .select('*')
        .eq('lane_id', laneId)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;
      return config;
    } catch (error) {
      console.error('Error fetching lane config:', error);
      throw new Error('Failed to fetch lane configuration');
    }
  }

  // Update lane configuration
  async updateLaneConfig(laneId: string, config: WarehouseLaneConfigUpdate): Promise<WarehouseLaneConfig> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('warehouse_lane_configs')
        .update({
          ...config,
          updated_by: user.id
        })
        .eq('lane_id', laneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lane config:', error);
      throw new Error('Failed to update lane configuration');
    }
  }

  // Update racks for a lane
  async updateLaneRacks(laneId: string, racks: WarehouseRackInsert[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete existing racks
      await supabase
        .from('warehouse_racks')
        .delete()
        .eq('lane_id', laneId);

      // Insert new racks
      for (const rack of racks) {
        const { error } = await supabase
          .from('warehouse_racks')
          .insert({
            ...rack,
            lane_id: laneId,
            created_by: user.id,
            updated_by: user.id
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating lane racks:', error);
      throw new Error('Failed to update lane racks');
    }
  }
}

export const warehouseService = new WarehouseService();
export default warehouseService;

export type {
  Warehouse,
  WarehouseInsert,
  WarehouseUpdate,
  WarehouseFloor,
  WarehouseFloorInsert,
  WarehouseFloorUpdate,
  WarehouseLane,
  WarehouseLaneInsert,
  WarehouseLaneUpdate,
  WarehouseRack,
  WarehouseRackInsert,
  WarehouseRackUpdate,
  WarehouseLaneConfig,
  WarehouseLaneConfigInsert,
  WarehouseLaneConfigUpdate,
  WarehouseWithDetails,
  WarehouseFloorWithDetails,
  WarehouseLaneWithDetails,
  CreateWarehouseData,
  UpdateWarehouseData
}; 
import { supabase } from '@/integrations/supabase/client';
import { AddInventoryRequest, InventoryLocationInput } from './types';

export interface InventoryImportData {
  sku_code: string;
  floor_name: string;
  lane_name: string;
  rack_name: string;
  quantity: number;
}

export interface InventoryImportResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class InventoryImportService {
  // Import inventory data for a specific warehouse
  async importInventory(
    warehouseId: string,
    inventoryData: InventoryImportData[]
  ): Promise<InventoryImportResult[]> {
    const results: InventoryImportResult[] = [];

    for (const item of inventoryData) {
      try {
        // Step 1: Find the SKU
        const { data: sku, error: skuError } = await supabase
          .from('skus')
          .select('id')
          .eq('sku_code', item.sku_code)
          .single();

        if (skuError || !sku) {
          results.push({
            success: false,
            message: `SKU not found: ${item.sku_code}`,
            error: 'SKU_NOT_FOUND'
          });
          continue;
        }

        // Step 2: Find the floor
        const { data: floor, error: floorError } = await supabase
          .from('warehouse_floors')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('name', item.floor_name)
          .single();

        if (floorError || !floor) {
          results.push({
            success: false,
            message: `Floor not found: ${item.floor_name}`,
            error: 'FLOOR_NOT_FOUND'
          });
          continue;
        }

        // Step 3: Find the lane
        const { data: lane, error: laneError } = await supabase
          .from('warehouse_lanes')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('floor_id', floor.id)
          .eq('name', item.lane_name)
          .single();

        if (laneError || !lane) {
          results.push({
            success: false,
            message: `Lane not found: ${item.lane_name} in floor ${item.floor_name}`,
            error: 'LANE_NOT_FOUND'
          });
          continue;
        }

        // Step 4: Find the rack
        const { data: rack, error: rackError } = await supabase
          .from('warehouse_racks')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('lane_id', lane.id)
          .eq('rack_name', item.rack_name)
          .single();

        if (rackError || !rack) {
          results.push({
            success: false,
            message: `Rack not found: ${item.rack_name} in lane ${item.lane_name}`,
            error: 'RACK_NOT_FOUND'
          });
          continue;
        }

        // Step 5: Check if inventory already exists for this SKU in this warehouse
        const { data: existingInventory, error: existingError } = await supabase
          .from('warehouse_inventory')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('sku_id', sku.id)
          .single();

        if (existingInventory) {
          // Update existing inventory
          const locationInput: InventoryLocationInput = {
            floor_id: floor.id,
            lane_id: lane.id,
            rack_id: rack.id,
            quantity: item.quantity
          };

          const updateRequest = {
            warehouse_inventory_id: existingInventory.id,
            locations: [locationInput]
          };

          await supabase
            .from('warehouse_inventory_locations')
            .upsert([{
              warehouse_inventory_id: existingInventory.id,
              floor_id: floor.id,
              lane_id: lane.id,
              rack_id: rack.id,
              quantity: item.quantity
            }], {
              onConflict: 'warehouse_inventory_id,floor_id,lane_id,rack_id'
            });

          results.push({
            success: true,
            message: `Updated inventory for SKU ${item.sku_code} at ${item.floor_name}/${item.lane_name}/${item.rack_name}`,
            data: { action: 'updated', inventory_id: existingInventory.id }
          });
        } else {
          // Create new inventory
          const addRequest: AddInventoryRequest = {
            warehouse_id: warehouseId,
            sku_id: sku.id,
            locations: [{
              floor_id: floor.id,
              lane_id: lane.id,
              rack_id: rack.id,
              quantity: item.quantity
            }]
          };

          const newInventory = await supabase
            .from('warehouse_inventory')
            .insert([{
              warehouse_id: warehouseId,
              sku_id: sku.id,
              total_quantity: 0,
              reserved_quantity: 0
            }])
            .select()
            .single();

          if (newInventory.data) {
            await supabase
              .from('warehouse_inventory_locations')
              .insert([{
                warehouse_inventory_id: newInventory.data.id,
                floor_id: floor.id,
                lane_id: lane.id,
                rack_id: rack.id,
                quantity: item.quantity
              }]);

            results.push({
              success: true,
              message: `Added inventory for SKU ${item.sku_code} at ${item.floor_name}/${item.lane_name}/${item.rack_name}`,
              data: { action: 'created', inventory_id: newInventory.data.id }
            });
          } else {
            results.push({
              success: false,
              message: `Failed to create inventory for SKU ${item.sku_code}`,
              error: 'CREATE_FAILED'
            });
          }
        }
      } catch (error) {
        results.push({
          success: false,
          message: `Error processing ${item.sku_code}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: 'PROCESSING_ERROR'
        });
      }
    }

    return results;
  }

  // Get warehouse structure for validation
  async getWarehouseStructure(warehouseId: string) {
    const { data: floors, error: floorsError } = await supabase
      .from('warehouse_floors')
      .select(`
        id,
        name,
        lanes:warehouse_lanes(
          id,
          name,
          racks:warehouse_racks(
            id,
            rack_name
          )
        )
      `)
      .eq('warehouse_id', warehouseId);

    if (floorsError) {
      throw new Error('Failed to fetch warehouse structure');
    }

    return floors;
  }

  // Validate inventory import data against warehouse structure
  async validateInventoryData(
    warehouseId: string,
    inventoryData: InventoryImportData[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get warehouse structure
    const warehouseStructure = await this.getWarehouseStructure(warehouseId);
    
    // Create lookup maps
    const floorMap = new Map();
    const laneMap = new Map();
    const rackMap = new Map();

    warehouseStructure?.forEach(floor => {
      floorMap.set(floor.name, floor.id);
      floor.lanes?.forEach(lane => {
        laneMap.set(`${floor.name}-${lane.name}`, lane.id);
        lane.racks?.forEach(rack => {
          rackMap.set(`${floor.name}-${lane.name}-${rack.rack_name}`, rack.id);
        });
      });
    });

    // Validate each inventory item
    for (const item of inventoryData) {
      // Check if floor exists
      if (!floorMap.has(item.floor_name)) {
        errors.push(`Floor "${item.floor_name}" not found in warehouse`);
      }

      // Check if lane exists
      if (!laneMap.has(`${item.floor_name}-${item.lane_name}`)) {
        errors.push(`Lane "${item.lane_name}" not found in floor "${item.floor_name}"`);
      }

      // Check if rack exists
      if (!rackMap.has(`${item.floor_name}-${item.lane_name}-${item.rack_name}`)) {
        errors.push(`Rack "${item.rack_name}" not found in lane "${item.lane_name}" of floor "${item.floor_name}"`);
      }

      // Check if SKU exists
      const { data: sku } = await supabase
        .from('skus')
        .select('id')
        .eq('sku_code', item.sku_code)
        .single();

      if (!sku) {
        errors.push(`SKU "${item.sku_code}" not found`);
      }

      // Check quantity
      if (item.quantity <= 0) {
        errors.push(`Quantity must be positive for SKU "${item.sku_code}"`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const inventoryImportService = new InventoryImportService(); 
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WarehouseFloor {
  id: string;
  name: string;
  floor_number: number;
  description?: string;
}

export interface WarehouseLane {
  id: string;
  name: string;
  lane_number: number;
  floor_id: string;
  description?: string;
}

export interface WarehouseRack {
  id: string;
  rack_name: string;
  rack_number: number;
  lane_id: string;
  side: 'left' | 'right';
  is_enabled: boolean;
}

export interface WarehouseStructure {
  floors: WarehouseFloor[];
  lanes: WarehouseLane[];
  racks: WarehouseRack[];
}

export interface UseWarehouseStructureResult {
  structure: WarehouseStructure;
  loading: boolean;
  error: string | null;
  getFloorsByWarehouse: (warehouseId: string) => WarehouseFloor[];
  getLanesByFloor: (floorId: string) => WarehouseLane[];
  getRacksByLane: (laneId: string) => WarehouseRack[];
  refreshStructure: (warehouseId: string) => Promise<void>;
}

export const useWarehouseStructure = (warehouseId?: string): UseWarehouseStructureResult => {
  const [structure, setStructure] = useState<WarehouseStructure>({
    floors: [],
    lanes: [],
    racks: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouseStructure = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch floors
      const { data: floors, error: floorsError } = await supabase
        .from('warehouse_floors')
        .select('id, name, floor_number, description')
        .eq('warehouse_id', id)
        .eq('status', 'active')
        .order('floor_number');

      if (floorsError) throw floorsError;

      // Fetch lanes
      const { data: lanes, error: lanesError } = await supabase
        .from('warehouse_lanes')
        .select('id, name, lane_number, floor_id, description')
        .eq('warehouse_id', id)
        .eq('status', 'active')
        .order('lane_number');

      if (lanesError) throw lanesError;

      // Fetch racks
      const { data: racks, error: racksError } = await supabase
        .from('warehouse_racks')
        .select('id, rack_name, rack_number, lane_id, side, is_enabled')
        .in('lane_id', lanes?.map(lane => lane.id) || [])
        .eq('status', 'active')
        .eq('is_enabled', true)
        .order('rack_number');

      if (racksError) throw racksError;

      setStructure({
        floors: floors || [],
        lanes: lanes || [],
        racks: racks || []
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouse structure';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFloorsByWarehouse = useCallback((id: string) => {
    return structure.floors.filter(floor => 
      structure.lanes.some(lane => lane.floor_id === floor.id)
    );
  }, [structure.floors, structure.lanes]);

  const getLanesByFloor = useCallback((floorId: string) => {
    return structure.lanes.filter(lane => lane.floor_id === floorId);
  }, [structure.lanes]);

  const getRacksByLane = useCallback((laneId: string) => {
    return structure.racks.filter(rack => rack.lane_id === laneId);
  }, [structure.racks]);

  const refreshStructure = useCallback(async (id: string) => {
    await fetchWarehouseStructure(id);
  }, [fetchWarehouseStructure]);

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouseStructure(warehouseId);
    }
  }, [warehouseId, fetchWarehouseStructure]);

  return {
    structure,
    loading,
    error,
    getFloorsByWarehouse,
    getLanesByFloor,
    getRacksByLane,
    refreshStructure
  };
};

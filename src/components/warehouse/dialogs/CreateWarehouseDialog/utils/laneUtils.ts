import { type Lane, type Floor } from '../types';

export const getLanesForFloor = (lanes: Lane[], floorNumber: number): Lane[] => {
  return lanes.filter(lane => lane.floor_number === floorNumber);
};

export const canRemoveLane = (lanes: Lane[], floorNumber: number): boolean => {
  const floorLanes = getLanesForFloor(lanes, floorNumber);
  return floorLanes.length > 1;
};

export const hasDuplicateLaneNames = (lanes: Lane[], floorNumber: number): boolean => {
  const floorLanes = getLanesForFloor(lanes, floorNumber);
  const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
  const uniqueNames = new Set(laneNames);
  return laneNames.length !== uniqueNames.size;
};

export const getDuplicateLaneNames = (lanes: Lane[], floorNumber: number): string[] => {
  const floorLanes = getLanesForFloor(lanes, floorNumber);
  const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
  const duplicates = laneNames.filter((name, index) => laneNames.indexOf(name) !== index);
  return [...new Set(duplicates)];
};

export const createDefaultLanes = (floors: Floor[], existingLanes: Lane[]): Lane[] => {
  if (existingLanes.length > 0 || floors.length === 0) {
    return [];
  }

  // Check if each floor has at least one lane
  const floorsWithoutLanes = floors.filter(floor => {
    const floorLanes = existingLanes.filter(lane => lane.floor_number === floor.floor_number);
    return floorLanes.length === 0;
  });
  
  if (floorsWithoutLanes.length === 0) {
    return [];
  }

  return floorsWithoutLanes.map(floor => ({
    id: `lane-${floor.id}-${Date.now()}`,
    name: `Lane 1`,
    lane_number: 1,
    floor_number: floor.floor_number,
    default_direction: 'left' as const,
    rack_config: {
      left_side_enabled: true,
      right_side_enabled: true,
      left_racks: [
        { id: '1', rack_name: 'A', rack_number: 1 },
        { id: '2', rack_name: 'B', rack_number: 2 },
        { id: '3', rack_name: 'C', rack_number: 3 },
        { id: '4', rack_name: 'D', rack_number: 4 }
      ],
      right_racks: [
        { id: '5', rack_name: 'A', rack_number: 1 },
        { id: '6', rack_name: 'B', rack_number: 2 },
        { id: '7', rack_name: 'C', rack_number: 3 },
        { id: '8', rack_name: 'D', rack_number: 4 }
      ]
    }
  }));
}; 
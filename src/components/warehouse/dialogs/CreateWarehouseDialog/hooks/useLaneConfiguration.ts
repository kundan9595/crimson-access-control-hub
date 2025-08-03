import { useState, useCallback } from 'react';
import { type Lane } from '../types';

interface UseLaneConfigurationProps {
  lanes: Lane[];
  onLanesChange: (lanes: Lane[]) => void;
}

export const useLaneConfiguration = ({ lanes, onLanesChange }: UseLaneConfigurationProps) => {
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [configuringLaneId, setConfiguringLaneId] = useState<string | null>(null);

  const updateLane = useCallback((laneId: string, field: keyof Lane, value: any) => {
    const updatedLanes = lanes.map(lane =>
      lane.id === laneId ? { ...lane, [field]: value } : lane
    );
    onLanesChange(updatedLanes);
  }, [lanes, onLanesChange]);

  const addLane = useCallback((floorNumber: number) => {
    const floorLanes = lanes.filter(lane => lane.floor_number === floorNumber);
    const newLaneNumber = floorLanes.length + 1;
    
    const newLane: Lane = {
      id: `lane-${floorNumber}-${Date.now()}`,
      name: `Lane ${newLaneNumber}`,
      lane_number: newLaneNumber,
      floor_number: floorNumber,
      default_direction: 'left',
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
    };

    onLanesChange([...lanes, newLane]);
  }, [lanes, onLanesChange]);

  const removeLane = useCallback((laneId: string) => {
    const updatedLanes = lanes.filter(lane => lane.id !== laneId);
    onLanesChange(updatedLanes);
  }, [lanes, onLanesChange]);

  const startEditing = useCallback((lane: Lane) => {
    setEditingLaneId(lane.id);
    setEditValue(lane.name);
  }, []);

  const saveEdit = useCallback((laneId: string) => {
    if (editValue.trim()) {
      updateLane(laneId, 'name', editValue.trim());
    }
    setEditingLaneId(null);
    setEditValue('');
  }, [editValue, updateLane]);

  const cancelEdit = useCallback(() => {
    setEditingLaneId(null);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, laneId: string) => {
    if (e.key === 'Enter') {
      saveEdit(laneId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  const toggleRackConfig = useCallback((laneId: string) => {
    setConfiguringLaneId(configuringLaneId === laneId ? null : laneId);
  }, [configuringLaneId]);

  const updateRackConfig = useCallback((laneId: string, side: 'left' | 'right', enabled: boolean) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const updatedConfig = {
      ...lane.rack_config,
      [`${side}_side_enabled`]: enabled
    };

    updateLane(laneId, 'rack_config', updatedConfig);
  }, [lanes, updateLane]);

  const updateRackName = useCallback((laneId: string, side: 'left' | 'right', rackId: string, newName: string) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const updatedRacks = lane.rack_config[`${side}_racks`].map(rack =>
      rack.id === rackId ? { ...rack, rack_name: newName } : rack
    );

    const updatedConfig = {
      ...lane.rack_config,
      [`${side}_racks`]: updatedRacks
    };

    updateLane(laneId, 'rack_config', updatedConfig);
  }, [lanes, updateLane]);

  const addRack = useCallback((laneId: string, side: 'left' | 'right') => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const currentRacks = lane.rack_config[`${side}_racks`];
    const newRackNumber = currentRacks.length + 1;
    const newRack = {
      id: `${side}-rack-${Date.now()}`,
      rack_name: String.fromCharCode(64 + newRackNumber), // A, B, C, etc.
      rack_number: newRackNumber
    };

    const updatedRacks = [...currentRacks, newRack];
    const updatedConfig = {
      ...lane.rack_config,
      [`${side}_racks`]: updatedRacks
    };

    updateLane(laneId, 'rack_config', updatedConfig);
  }, [lanes, updateLane]);

  const removeRack = useCallback((laneId: string, side: 'left' | 'right', rackId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const currentRacks = lane.rack_config[`${side}_racks`];
    if (currentRacks.length <= 1) return; // Don't allow removing the last rack

    const updatedRacks = currentRacks
      .filter(rack => rack.id !== rackId)
      .map((rack, index) => ({
        ...rack,
        rack_number: index + 1,
        rack_name: String.fromCharCode(65 + index) // A, B, C, etc.
      }));

    const updatedConfig = {
      ...lane.rack_config,
      [`${side}_racks`]: updatedRacks
    };

    updateLane(laneId, 'rack_config', updatedConfig);
  }, [lanes, updateLane]);

  const toggleDefaultDirection = useCallback((laneId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const newDirection = lane.default_direction === 'left' ? 'right' : 'left';
    updateLane(laneId, 'default_direction', newDirection);
  }, [lanes, updateLane]);

  return {
    editingLaneId,
    editValue,
    setEditValue,
    configuringLaneId,
    addLane,
    removeLane,
    updateLane,
    startEditing,
    saveEdit,
    cancelEdit,
    handleKeyDown,
    toggleRackConfig,
    updateRackConfig,
    updateRackName,
    addRack,
    removeRack,
    toggleDefaultDirection
  };
}; 
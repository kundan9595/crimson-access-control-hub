import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Settings, ArrowLeft, ArrowRight, X, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { type Lane, type Floor } from './types';

interface LanesStepProps {
  lanes: Lane[];
  floors: Floor[];
  onLanesChange: (lanes: Lane[]) => void;
  errors?: Record<string, string>;
}

const LanesStep: React.FC<LanesStepProps> = ({
  lanes,
  floors,
  onLanesChange,
  errors = {}
}) => {
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [configuringLaneId, setConfiguringLaneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Memoize the default lanes to prevent unnecessary re-computations
  const defaultLanes = useMemo(() => {
    if (lanes.length > 0 || floors.length === 0) {
      return [];
    }

    // Check if each floor has at least one lane
    const floorsWithoutLanes = floors.filter(floor => {
      const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
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
  }, [floors, lanes.length]);

  // Set initial active tab only once when floors change
  useEffect(() => {
    if (floors.length > 0 && !activeTab) {
      setActiveTab(floors[0].id);
    }
  }, [floors, activeTab]);

  // Create default lanes only once when needed
  useEffect(() => {
    if (defaultLanes.length > 0) {
      onLanesChange([...lanes, ...defaultLanes]);
    }
  }, [defaultLanes, onLanesChange]);

  // Set initialization complete after a short delay to prevent glitch
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading skeleton while initializing
  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const addLane = (floorNumber: number) => {
    const floorLanes = lanes.filter(lane => lane.floor_number === floorNumber);
    
    // Generate a unique lane name
    let laneNumber = 1;
    let laneName = `Lane ${laneNumber}`;
    
    // Check if the name already exists and find the next available number
    while (floorLanes.some(lane => lane.name.toLowerCase() === laneName.toLowerCase())) {
      laneNumber++;
      laneName = `Lane ${laneNumber}`;
    }
    
    const newLane: Lane = {
      id: `lane-${Date.now()}`,
      name: laneName,
      lane_number: floorLanes.length + 1,
      floor_number: floorNumber,
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
    };
    onLanesChange([...lanes, newLane]);
  };

  const removeLane = (laneId: string) => {
    const laneToRemove = lanes.find(lane => lane.id === laneId);
    if (!laneToRemove) return;

    // Don't allow removing the only lane on a floor
    const floorLanes = lanes.filter(lane => lane.floor_number === laneToRemove.floor_number);
    if (floorLanes.length <= 1) return;

    const updatedLanes = lanes.filter(lane => lane.id !== laneId);
    onLanesChange(updatedLanes);
  };

  const updateLane = (laneId: string, field: keyof Lane, value: any) => {
    const updatedLanes = lanes.map(lane =>
      lane.id === laneId ? { ...lane, [field]: value } : lane
    );
    onLanesChange(updatedLanes);
  };

  const startEditing = (lane: Lane) => {
    setEditingLaneId(lane.id);
    setEditValue(lane.name);
  };

  const saveEdit = (laneId: string) => {
    if (editValue.trim()) {
      // Check for duplicate lane names within the same floor
      const lane = lanes.find(l => l.id === laneId);
      if (lane) {
        const floorLanes = lanes.filter(l => 
          l.floor_number === lane.floor_number && l.id !== laneId
        );
        const isDuplicate = floorLanes.some(l => l.name.toLowerCase() === editValue.trim().toLowerCase());
        
        if (isDuplicate) {
          toast.error(`A lane with the name "${editValue.trim()}" already exists on this floor. Please choose a unique name.`);
          return;
        }
      }
      
      updateLane(laneId, 'name', editValue.trim());
    }
    setEditingLaneId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingLaneId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, laneId: string) => {
    if (e.key === 'Enter') {
      saveEdit(laneId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const toggleRackConfig = (laneId: string) => {
    setConfiguringLaneId(configuringLaneId === laneId ? null : laneId);
  };

  const updateRackConfig = (laneId: string, side: 'left' | 'right', enabled: boolean) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const updatedConfig = {
      ...lane.rack_config,
      [`${side}_side_enabled`]: enabled
    };

    updateLane(laneId, 'rack_config', updatedConfig);
  };

  const updateRackName = (laneId: string, side: 'left' | 'right', rackId: string, newName: string) => {
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
  };

  const addRack = (laneId: string, side: 'left' | 'right') => {
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
  };

  const removeRack = (laneId: string, side: 'left' | 'right', rackId: string) => {
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
  };

  const toggleDefaultDirection = (laneId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    if (!lane) return;

    const newDirection = lane.default_direction === 'left' ? 'right' : 'left';
    updateLane(laneId, 'default_direction', newDirection);
  };

  const getLanesForFloor = (floorNumber: number) => {
    return lanes.filter(lane => lane.floor_number === floorNumber);
  };

  const canRemoveLane = (floorNumber: number) => {
    const floorLanes = getLanesForFloor(floorNumber);
    return floorLanes.length > 1;
  };

  // Helper function to check for duplicate lane names within a floor
  const hasDuplicateLaneNames = (floorNumber: number) => {
    const floorLanes = getLanesForFloor(floorNumber);
    const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
    const uniqueNames = new Set(laneNames);
    return laneNames.length !== uniqueNames.size;
  };

  // Helper function to get duplicate lane names for a floor
  const getDuplicateLaneNames = (floorNumber: number) => {
    const floorLanes = getLanesForFloor(floorNumber);
    const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
    const duplicates = laneNames.filter((name, index) => laneNames.indexOf(name) !== index);
    return [...new Set(duplicates)];
  };

  if (floors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No floors configured</p>
        <p className="text-sm">Please add floors in the previous step</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-start">
          {floors.map((floor) => (
            <TabsTrigger 
              key={floor.id} 
              value={floor.id}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 border border-red-300 flex-shrink-0">
                <span className="text-red-700 font-bold text-xs">{floor.floor_number}</span>
              </div>
              <span className="truncate">{floor.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {floors.map((floor) => {
          const floorLanes = getLanesForFloor(floor.floor_number);
          
          return (
            <TabsContent key={floor.id} value={floor.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 border-2 border-red-300">
                    <span className="text-red-700 font-bold text-xs">{floor.floor_number}</span>
                  </div>
                  <span className="text-lg font-medium">Configure Lanes for {floor.name}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addLane(floor.floor_number)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Lane
                </Button>
              </div>

              {/* Show duplicate lane name warning */}
              {hasDuplicateLaneNames(floor.floor_number) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-800 text-sm font-medium">⚠️ Duplicate Lane Names</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    The following lane names are duplicated on this floor: {getDuplicateLaneNames(floor.floor_number).join(', ')}. 
                    Please ensure each lane has a unique name.
                  </p>
                </div>
              )}

              {floorLanes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No lanes added for this floor</p>
                  <p className="text-sm">Click "Add Lane" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {floorLanes.map((lane, index) => (
                    <Card key={lane.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-300">
                              <span className="text-red-700 font-bold text-sm">{lane.lane_number}</span>
                            </div>
                            {editingLaneId === lane.id ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveEdit(lane.id)}
                                onKeyDown={(e) => handleKeyDown(e, lane.id)}
                                className="border-none shadow-none p-0 text-lg font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto min-w-0 w-auto"
                                style={{ 
                                  fontSize: '1.125rem',
                                  lineHeight: '1.75rem',
                                  fontWeight: '500'
                                }}
                                autoFocus
                              />
                            ) : (
                              <span 
                                className="text-lg font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => startEditing(lane)}
                              >
                                {lane.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={configuringLaneId === lane.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleRackConfig(lane.id)}
                              className="flex items-center gap-2"
                            >
                              <Settings className="h-4 w-4" />
                              {configuringLaneId === lane.id ? 'Close Config' : 'Configure Racks'}
                            </Button>
                            {canRemoveLane(floor.floor_number) && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLane(lane.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Rack Preview - Only show when not configuring */}
                      {configuringLaneId !== lane.id && (
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 ${!lane.rack_config.left_side_enabled ? 'opacity-40 grayscale' : ''}`}>
                              <span className={`text-sm font-medium ${!lane.rack_config.left_side_enabled ? 'text-gray-400' : ''}`}>
                                Left Side ({lane.rack_config.left_racks.length})
                                {!lane.rack_config.left_side_enabled && ' (Disabled)'}
                              </span>
                              <div className="flex gap-1">
                                {lane.rack_config.left_racks.map((rack, idx) => (
                                  <div 
                                    key={rack.id} 
                                    className={`w-8 h-8 border rounded flex items-center justify-center text-xs font-medium ${
                                      lane.rack_config.left_side_enabled 
                                        ? 'border-pink-200 bg-pink-50' 
                                        : 'border-gray-200 bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    {rack.rack_name}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleDefaultDirection(lane.id)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title={`Default direction: ${lane.default_direction === 'left' ? 'Left' : 'Right'}. Click to toggle.`}
                            >
                              {lane.default_direction === 'left' ? (
                                <ArrowLeft className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <div className={`flex items-center gap-2 ${!lane.rack_config.right_side_enabled ? 'opacity-40 grayscale' : ''}`}>
                              <div className="flex gap-1">
                                {lane.rack_config.right_racks.map((rack, idx) => (
                                  <div 
                                    key={rack.id} 
                                    className={`w-8 h-8 border rounded flex items-center justify-center text-xs font-medium ${
                                      lane.rack_config.right_side_enabled 
                                        ? 'border-pink-200 bg-pink-50' 
                                        : 'border-gray-200 bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    {rack.rack_name}
                                  </div>
                                ))}
                              </div>
                              <span className={`text-sm font-medium ${!lane.rack_config.right_side_enabled ? 'text-gray-400' : ''}`}>
                                Right Side ({lane.rack_config.right_racks.length})
                                {!lane.rack_config.right_side_enabled && ' (Disabled)'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      )}

                      {/* Inline Rack Configuration */}
                      {configuringLaneId === lane.id && (
                        <CardContent className="border-t pt-4 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side Configuration */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Left Side</h4>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`left-enabled-${lane.id}`}
                                    checked={lane.rack_config.left_side_enabled}
                                    onCheckedChange={(checked) => updateRackConfig(lane.id, 'left', checked)}
                                  />
                                  <label htmlFor={`left-enabled-${lane.id}`} className="text-sm">
                                    Enabled
                                  </label>
                                </div>
                              </div>

                              {lane.rack_config.left_side_enabled && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Racks ({lane.rack_config.left_racks.length})</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addRack(lane.id, 'left')}
                                      className="flex items-center gap-1 h-7 px-2"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {lane.rack_config.left_racks.map((rack) => (
                                      <div key={rack.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-xs text-gray-600">Rack {rack.rack_number}</label>
                                          {lane.rack_config.left_racks.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeRack(lane.id, 'left', rack.id)}
                                              className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                        <Input
                                          value={rack.rack_name}
                                          onChange={(e) => updateRackName(lane.id, 'left', rack.id, e.target.value)}
                                          className="text-center text-sm h-8"
                                          maxLength={2}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Side Configuration */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">Right Side</h4>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`right-enabled-${lane.id}`}
                                    checked={lane.rack_config.right_side_enabled}
                                    onCheckedChange={(checked) => updateRackConfig(lane.id, 'right', checked)}
                                  />
                                  <label htmlFor={`right-enabled-${lane.id}`} className="text-sm">
                                    Enabled
                                  </label>
                                </div>
                              </div>

                              {lane.rack_config.right_side_enabled && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Racks ({lane.rack_config.right_racks.length})</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addRack(lane.id, 'right')}
                                      className="flex items-center gap-1 h-7 px-2"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Add
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {lane.rack_config.right_racks.map((rack) => (
                                      <div key={rack.id} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="text-xs text-gray-600">Rack {rack.rack_number}</label>
                                          {lane.rack_config.right_racks.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeRack(lane.id, 'right', rack.id)}
                                              className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                            >
                                              <Minus className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                        <Input
                                          value={rack.rack_name}
                                          onChange={(e) => updateRackName(lane.id, 'right', rack.id, e.target.value)}
                                          className="text-center text-sm h-8"
                                          maxLength={2}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {errors.lanes && (
        <p className="text-sm text-red-500">{errors.lanes}</p>
      )}
    </div>
  );
};

export default LanesStep; 
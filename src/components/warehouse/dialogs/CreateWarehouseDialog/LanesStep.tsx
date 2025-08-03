import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { type Lane, type Floor } from './types';
import { useLaneConfiguration } from './hooks';
import { createDefaultLanes } from './utils';
import { FloorLanes } from './components';

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
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    editingLaneId,
    editValue,
    setEditValue,
    configuringLaneId,
    addLane,
    removeLane,
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
  } = useLaneConfiguration({ lanes, onLanesChange });

  // Memoize the default lanes to prevent unnecessary re-computations
  const defaultLanes = useMemo(() => {
    return createDefaultLanes(floors, lanes);
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

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

        {floors.map((floor) => (
          <TabsContent key={floor.id} value={floor.id}>
            <FloorLanes
              floor={floor}
              lanes={lanes}
              editingLaneId={editingLaneId}
              editValue={editValue}
              configuringLaneId={configuringLaneId}
              onAddLane={addLane}
              onStartEditing={startEditing}
              onEditChange={setEditValue}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onKeyDown={handleKeyDown}
              onToggleRackConfig={toggleRackConfig}
              onRemoveLane={removeLane}
              onToggleDefaultDirection={toggleDefaultDirection}
              onUpdateRackConfig={updateRackConfig}
              onUpdateRackName={updateRackName}
              onAddRack={addRack}
              onRemoveRack={removeRack}
            />
          </TabsContent>
        ))}
      </Tabs>

      {errors.lanes && (
        <p className="text-sm text-red-500">{errors.lanes}</p>
      )}
    </div>
  );
};

export default LanesStep; 
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { type Lane, type Floor } from '../types';
import LaneCard from './LaneCard';
import { canRemoveLane, hasDuplicateLaneNames, getDuplicateLaneNames } from '../utils';

interface FloorLanesProps {
  floor: Floor;
  lanes: Lane[];
  editingLaneId: string | null;
  editValue: string;
  configuringLaneId: string | null;
  onAddLane: (floorNumber: number) => void;
  onStartEditing: (lane: Lane) => void;
  onEditChange: (value: string) => void;
  onSaveEdit: (laneId: string) => void;
  onCancelEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent, laneId: string) => void;
  onToggleRackConfig: (laneId: string) => void;
  onRemoveLane: (laneId: string) => void;
  onToggleDefaultDirection: (laneId: string) => void;
  onUpdateRackConfig: (laneId: string, side: 'left' | 'right', enabled: boolean) => void;
  onUpdateRackName: (laneId: string, side: 'left' | 'right', rackId: string, newName: string) => void;
  onAddRack: (laneId: string, side: 'left' | 'right') => void;
  onRemoveRack: (laneId: string, side: 'left' | 'right', rackId: string) => void;
}

const FloorLanes: React.FC<FloorLanesProps> = ({
  floor,
  lanes,
  editingLaneId,
  editValue,
  configuringLaneId,
  onAddLane,
  onStartEditing,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onKeyDown,
  onToggleRackConfig,
  onRemoveLane,
  onToggleDefaultDirection,
  onUpdateRackConfig,
  onUpdateRackName,
  onAddRack,
  onRemoveRack
}) => {
  const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
  const canRemove = canRemoveLane(lanes, floor.floor_number);
  const hasDuplicates = hasDuplicateLaneNames(lanes, floor.floor_number);
  const duplicateNames = getDuplicateLaneNames(lanes, floor.floor_number);

  return (
    <div className="space-y-4">
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
          onClick={() => onAddLane(floor.floor_number)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Lane
        </Button>
      </div>

      {/* Show duplicate lane name warning */}
      {hasDuplicates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-800 text-sm font-medium">⚠️ Duplicate Lane Names</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            The following lane names are duplicated on this floor: {duplicateNames.join(', ')}. 
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
          {floorLanes.map((lane) => (
            <LaneCard
              key={lane.id}
              lane={lane}
              isEditing={editingLaneId === lane.id}
              editValue={editValue}
              isConfiguring={configuringLaneId === lane.id}
              canRemove={canRemove}
              onStartEditing={onStartEditing}
              onEditChange={onEditChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onKeyDown={onKeyDown}
              onToggleRackConfig={onToggleRackConfig}
              onRemoveLane={onRemoveLane}
              onToggleDefaultDirection={onToggleDefaultDirection}
              onUpdateRackConfig={onUpdateRackConfig}
              onUpdateRackName={onUpdateRackName}
              onAddRack={onAddRack}
              onRemoveRack={onRemoveRack}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FloorLanes; 
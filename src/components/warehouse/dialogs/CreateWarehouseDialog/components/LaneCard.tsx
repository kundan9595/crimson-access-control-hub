import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, Settings, ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react';
import { type Lane } from '../types';

interface LaneCardProps {
  lane: Lane;
  isEditing: boolean;
  editValue: string;
  isConfiguring: boolean;
  canRemove: boolean;
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

const LaneCard: React.FC<LaneCardProps> = ({
  lane,
  isEditing,
  editValue,
  isConfiguring,
  canRemove,
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
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-300">
              <span className="text-red-700 font-bold text-sm">{lane.lane_number}</span>
            </div>
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={() => onSaveEdit(lane.id)}
                onKeyDown={(e) => onKeyDown(e, lane.id)}
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
                onClick={() => onStartEditing(lane)}
              >
                {lane.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isConfiguring ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleRackConfig(lane.id)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isConfiguring ? 'Close Config' : 'Configure Racks'}
            </Button>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveLane(lane.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Rack Preview - Only show when not configuring */}
      {!isConfiguring && (
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!lane.rack_config.left_side_enabled ? 'opacity-40 grayscale' : ''}`}>
              <span className={`text-sm font-medium ${!lane.rack_config.left_side_enabled ? 'text-gray-400' : ''}`}>
                Left Side ({lane.rack_config.left_racks.length})
                {!lane.rack_config.left_side_enabled && ' (Disabled)'}
              </span>
              <div className="flex gap-1">
                {lane.rack_config.left_racks.map((rack) => (
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
              onClick={() => onToggleDefaultDirection(lane.id)}
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
                {lane.rack_config.right_racks.map((rack) => (
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
      {isConfiguring && (
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
                    onCheckedChange={(checked) => onUpdateRackConfig(lane.id, 'left', checked)}
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
                      onClick={() => onAddRack(lane.id, 'left')}
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
                              onClick={() => onRemoveRack(lane.id, 'left', rack.id)}
                              className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={rack.rack_name}
                          onChange={(e) => onUpdateRackName(lane.id, 'left', rack.id, e.target.value)}
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
                    onCheckedChange={(checked) => onUpdateRackConfig(lane.id, 'right', checked)}
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
                      onClick={() => onAddRack(lane.id, 'right')}
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
                              onClick={() => onRemoveRack(lane.id, 'right', rack.id)}
                              className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={rack.rack_name}
                          onChange={(e) => onUpdateRackName(lane.id, 'right', rack.id, e.target.value)}
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
  );
};

export default LaneCard; 
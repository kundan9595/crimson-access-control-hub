import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { type Floor } from './types';

interface FloorsStepProps {
  floors: Floor[];
  onFloorsChange: (floors: Floor[]) => void;
  errors?: Record<string, string>;
}

const FloorsStep: React.FC<FloorsStepProps> = ({
  floors,
  onFloorsChange,
  errors = {}
}) => {
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Ensure there's always at least one floor
  useEffect(() => {
    if (floors.length === 0) {
      const defaultFloor: Floor = {
        id: `floor-${Date.now()}`,
        name: 'Floor 1',
        floor_number: 1
      };
      onFloorsChange([defaultFloor]);
    }
  }, [floors.length, onFloorsChange]);

  const addFloor = () => {
    const newFloor: Floor = {
      id: `floor-${Date.now()}`,
      name: `Floor ${floors.length + 1}`,
      floor_number: floors.length + 1
    };
    onFloorsChange([...floors, newFloor]);
  };

  const removeFloor = (floorId: string) => {
    // Don't allow removing the first floor
    if (floors.length <= 1) return;
    
    const updatedFloors = floors
      .filter(floor => floor.id !== floorId)
      .map((floor, index) => ({
        ...floor,
        name: floor.name.replace(/Floor \d+/, `Floor ${index + 1}`),
        floor_number: index + 1
      }));
    onFloorsChange(updatedFloors);
  };

  const updateFloor = (floorId: string, field: keyof Floor, value: string | number) => {
    const updatedFloors = floors.map(floor =>
      floor.id === floorId ? { ...floor, [field]: value } : floor
    );
    onFloorsChange(updatedFloors);
  };

  const startEditing = (floor: Floor) => {
    setEditingFloorId(floor.id);
    setEditValue(floor.name);
  };

  const saveEdit = (floorId: string) => {
    if (editValue.trim()) {
      updateFloor(floorId, 'name', editValue.trim());
    }
    setEditingFloorId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingFloorId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, floorId: string) => {
    if (e.key === 'Enter') {
      saveEdit(floorId);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Configure the floors in your warehouse
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFloor}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Floor
        </Button>
      </div>

      <div className="space-y-3">
        {floors.map((floor, index) => (
          <Card key={floor.id} className="border-2">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border-2 border-red-300">
                    <span className="text-red-700 font-bold text-sm">{floor.floor_number}</span>
                  </div>
                  {editingFloorId === floor.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEdit(floor.id)}
                      onKeyDown={(e) => handleKeyDown(e, floor.id)}
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
                      onClick={() => startEditing(floor)}
                    >
                      {floor.name}
                    </span>
                  )}
                </div>
                {floors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFloor(floor.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {errors.floors && (
        <p className="text-sm text-red-500">{errors.floors}</p>
      )}
    </div>
  );
};

export default FloorsStep; 
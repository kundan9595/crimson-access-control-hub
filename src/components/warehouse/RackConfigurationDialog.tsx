import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, ArrowRight, Plus, X, Settings, Package
} from 'lucide-react';
import { toast } from 'sonner';

interface Rack {
  id: string;
  rack_name: string;
  rack_number: number;
}

interface RackConfiguration {
  left_side_enabled: boolean;
  right_side_enabled: boolean;
  default_direction?: 'left' | 'right';
  left_racks: Rack[];
  right_racks: Rack[];
}

interface RackConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laneName: string;
  floorName: string;
  initialConfig?: RackConfiguration;
  onSave: (config: RackConfiguration) => void;
}

const RackConfigurationDialog: React.FC<RackConfigurationDialogProps> = ({
  open,
  onOpenChange,
  laneName,
  floorName,
  initialConfig,
  onSave
}) => {
  const [config, setConfig] = useState<RackConfiguration>({
    left_side_enabled: true,
    right_side_enabled: true,
    default_direction: 'left',
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
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const addRack = (side: 'left' | 'right') => {
    const racks = side === 'left' ? config.left_racks : config.right_racks;
    const newRack: Rack = {
      id: `${side}-${Date.now()}`,
      rack_name: String.fromCharCode(65 + racks.length), // A, B, C, D...
      rack_number: racks.length + 1
    };

    setConfig(prev => ({
      ...prev,
      [side === 'left' ? 'left_racks' : 'right_racks']: [...racks, newRack]
    }));
  };

  const removeRack = (side: 'left' | 'right', rackId: string) => {
    const racks = side === 'left' ? config.left_racks : config.right_racks;
    if (racks.length <= 1) {
      toast.error('At least one rack is required on each side');
      return;
    }

    setConfig(prev => ({
      ...prev,
      [side === 'left' ? 'left_racks' : 'right_racks']: racks.filter(r => r.id !== rackId)
    }));
  };

  const clearAllRacks = (side: 'left' | 'right') => {
    setConfig(prev => ({
      ...prev,
      [side === 'left' ? 'left_racks' : 'right_racks']: [
        { id: `${side}-1`, rack_name: 'A', rack_number: 1 }
      ]
    }));
  };

  const updateRackName = (side: 'left' | 'right', rackId: string, name: string) => {
    const racks = side === 'left' ? config.left_racks : config.right_racks;
    setConfig(prev => ({
      ...prev,
      [side === 'left' ? 'left_racks' : 'right_racks']: racks.map(rack =>
        rack.id === rackId ? { ...rack, rack_name: name } : rack
      )
    }));
  };

  const toggleSide = (side: 'left' | 'right') => {
    if (side === 'left' && !config.right_side_enabled) {
      toast.error('At least one side must be enabled');
      return;
    }
    if (side === 'right' && !config.left_side_enabled) {
      toast.error('At least one side must be enabled');
      return;
    }

    setConfig(prev => ({
      ...prev,
      [side === 'left' ? 'left_side_enabled' : 'right_side_enabled']: !prev[side === 'left' ? 'left_side_enabled' : 'right_side_enabled']
    }));
  };

  const toggleDirection = () => {
    setConfig(prev => ({
      ...prev,
      default_direction: prev.default_direction === 'left' ? 'right' : 'left'
    }));
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
    toast.success('Rack configuration saved!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Racks for {laneName} on {floorName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Side Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={config.left_side_enabled ? "default" : "outline"}
              onClick={() => toggleSide('left')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {config.left_side_enabled ? 'Disable' : 'Enable'} Left Side
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleDirection}
              className="flex items-center gap-2"
            >
              Default Direction: {config.default_direction === 'left' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>

            <Button
              variant={config.right_side_enabled ? "default" : "outline"}
              onClick={() => toggleSide('right')}
              className="flex items-center gap-2"
            >
              {config.right_side_enabled ? 'Disable' : 'Enable'} Right Side
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Rack Configuration Tabs */}
          <Tabs defaultValue="left" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="left" disabled={!config.left_side_enabled}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Left Side Racks
              </TabsTrigger>
              <TabsTrigger value="right" disabled={!config.right_side_enabled}>
                Right Side Racks
                <ArrowRight className="w-4 h-4 ml-2" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="left" className="space-y-4">
              {config.left_side_enabled ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Left Side Racks</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearAllRacks('left')}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addRack('left')}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Rack
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {config.left_racks.map((rack) => (
                      <div key={rack.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="secondary">{rack.rack_number}</Badge>
                        <Input
                          value={rack.rack_name}
                          onChange={(e) => updateRackName('left', rack.id, e.target.value)}
                          className="w-20"
                          maxLength={1}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRack('left', rack.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Left side is disabled
                </div>
              )}
            </TabsContent>

            <TabsContent value="right" className="space-y-4">
              {config.right_side_enabled ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Right Side Racks</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearAllRacks('right')}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addRack('right')}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Rack
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {config.right_racks.map((rack) => (
                      <div key={rack.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="secondary">{rack.rack_number}</Badge>
                        <Input
                          value={rack.rack_name}
                          onChange={(e) => updateRackName('right', rack.id, e.target.value)}
                          className="w-20"
                          maxLength={1}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRack('right', rack.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Right side is disabled
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RackConfigurationDialog; 
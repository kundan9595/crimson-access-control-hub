import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Plus, 
  X, 
  ArrowLeft, 
  ArrowRight,
  Settings,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import type { CreateWarehouseData } from '@/services/warehouseService';
import RackConfigurationDialog from './RackConfigurationDialog';

interface CreateWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateWarehouseData) => Promise<void>;
  initialData?: CreateWarehouseData;
  isEditMode?: boolean;
}

const CreateWarehouseDialog: React.FC<CreateWarehouseDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEditMode = false
}) => {
  const [currentStep, setCurrentStep] = useState<'basic' | 'floors' | 'lanes'>('basic');
  const [warehouseData, setWarehouseData] = useState<CreateWarehouseData>({
    warehouse: {
      name: '',
      description: '',
      city: '',
      state: '',
      country: 'USA',
      postal_code: '',
      address: '',
      status: 'active'
    },
    floors: [],
    lanes: []
  });

  const [floors, setFloors] = useState<Array<{ id: string; name: string; floor_number: number }>>([]);
  const [lanes, setLanes] = useState<Array<{ 
    id: string; 
    name: string; 
    floor_id: string; 
    lane_number: number; 
    default_direction?: 'left' | 'right';
    rack_config?: {
      left_side_enabled: boolean;
      right_side_enabled: boolean;
      left_racks: Array<{ id: string; rack_name: string; rack_number: number }>;
      right_racks: Array<{ id: string; rack_name: string; rack_number: number }>;
    };
  }>>([]);
  const [selectedLaneForRacks, setSelectedLaneForRacks] = useState<string | null>(null);
  const [isRackConfigOpen, setIsRackConfigOpen] = useState(false);

  // Initialize form with initialData when provided (for edit mode)
  useEffect(() => {
    if (initialData && open) {
      console.log('Loading initialData for edit mode:', initialData);
      console.log('Initial lanes data:', initialData.lanes);
      setWarehouseData(initialData);
      
      // Transform floors data
      const transformedFloors = initialData.floors.map((floor: any, index: number) => ({
        id: `floor-${index}`,
        name: floor.name,
        floor_number: floor.floor_number
      }));
      setFloors(transformedFloors);
      
      // Transform lanes data with correct floor mapping
      const transformedLanes = initialData.lanes.map((lane: any, index: number) => {
        // Find the correct floor index based on floor_number
        const floorIndex = transformedFloors.findIndex(floor => floor.floor_number === lane.floor_number);
        const correctFloorId = floorIndex >= 0 ? `floor-${floorIndex}` : `floor-0`;
        
        // Reconstruct rack_config from the saved racks data
        const leftRacks = lane.racks?.filter((rack: any) => rack.side === 'left') || [];
        const rightRacks = lane.racks?.filter((rack: any) => rack.side === 'right') || [];
        
        const transformedLane = {
          id: `lane-${index}`,
          name: lane.name,
          floor_id: correctFloorId,
          lane_number: lane.lane_number,
          default_direction: lane.config?.default_direction || 'left',
          rack_config: {
            left_side_enabled: lane.config?.left_side_enabled ?? true,
            right_side_enabled: lane.config?.right_side_enabled ?? true,
            default_direction: lane.config?.default_direction || 'left',
            left_racks: leftRacks.length > 0 ? leftRacks.map((rack: any, rackIndex: number) => ({
              id: `left-${rackIndex}`,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })) : [
              { id: '1', rack_name: 'A', rack_number: 1 },
              { id: '2', rack_name: 'B', rack_number: 2 },
              { id: '3', rack_name: 'C', rack_number: 3 },
              { id: '4', rack_name: 'D', rack_number: 4 }
            ],
            right_racks: rightRacks.length > 0 ? rightRacks.map((rack: any, rackIndex: number) => ({
              id: `right-${rackIndex}`,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })) : [
              { id: '5', rack_name: 'A', rack_number: 1 },
              { id: '6', rack_name: 'B', rack_number: 2 },
              { id: '7', rack_name: 'C', rack_number: 3 },
              { id: '8', rack_name: 'D', rack_number: 4 }
            ]
          }
        };
        
        console.log(`Transformed lane ${index}:`, transformedLane);
        console.log(`Mapped to floor_id: ${correctFloorId} (floor_number: ${lane.floor_number})`);
        return transformedLane;
      });
      setLanes(transformedLanes);
      
      // Always start from the first step (basic info) for both create and edit modes
      setCurrentStep('basic');
    }
  }, [initialData, open, isEditMode]);

  // Add default lanes when entering lanes step if no lanes exist (only in create mode)
  useEffect(() => {
    if (currentStep === 'lanes' && floors.length > 0 && lanes.length === 0 && !isEditMode) {
      // Add one default lane for each floor if no lanes exist (only in create mode)
      const defaultLanes = floors.map((floor, index) => ({
        id: `lane-${floor.id}-${index}`,
        name: `Lane ${index + 1}`,
        floor_id: floor.id,
        lane_number: index + 1,
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
      
      setLanes(defaultLanes);
    }
  }, [currentStep, floors, lanes.length, isEditMode]);

  const handleBasicInfoSave = () => {
    if (!warehouseData.warehouse.name.trim()) {
      toast.error('Warehouse name is required');
      return;
    }
    setCurrentStep('floors');
  };

  const handleFloorsSave = () => {
    if (floors.length === 0) {
      toast.error('At least one floor is required');
      return;
    }
    
            // Add one default lane for each floor
        const defaultLanes = floors.map((floor, index) => ({
          id: `lane-${floor.id}-${index}`,
          name: `Lane ${index + 1}`,
          floor_id: floor.id,
          lane_number: index + 1,
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
    
    setLanes(defaultLanes);
    setCurrentStep('lanes');
  };

  const handleLanesSave = () => {
    if (lanes.length === 0) {
      toast.error('At least one lane is required');
      return;
    }
    
    // Transform data to final format and save
    console.log('Saving lanes data:', lanes);
    const finalData: CreateWarehouseData = {
      warehouse: warehouseData.warehouse,
      floors: floors.map(floor => ({
        name: floor.name,
        floor_number: floor.floor_number
      })),
      lanes: lanes.map(lane => {
        const floor = floors.find(f => f.id === lane.floor_id);
        return {
          name: lane.name,
          lane_number: lane.lane_number,
          floor_number: floor?.floor_number || 1,
          config: {
            left_side_enabled: lane.rack_config?.left_side_enabled ?? true,
            right_side_enabled: lane.rack_config?.right_side_enabled ?? true,
            default_direction: lane.default_direction || 'left',
            default_left_racks: lane.rack_config?.left_racks?.length || 4,
            default_right_racks: lane.rack_config?.right_racks?.length || 4
          },
          racks: [
            // Left side racks from configuration
            ...(lane.rack_config?.left_racks?.map(rack => ({
              side: 'left' as const,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })) || Array.from({ length: 4 }, (_, i) => ({
              side: 'left' as const,
              rack_name: String.fromCharCode(65 + i), // A, B, C, D
              rack_number: i + 1
            }))),
            // Right side racks from configuration
            ...(lane.rack_config?.right_racks?.map(rack => ({
              side: 'right' as const,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })) || Array.from({ length: 4 }, (_, i) => ({
              side: 'right' as const,
              rack_name: String.fromCharCode(65 + i), // A, B, C, D
              rack_number: i + 1
            })))
          ]
        };
      })
    };

    console.log('Final data being saved:', finalData);
    onSave(finalData);
  };

  const addFloor = () => {
    const newFloor = {
      id: `floor-${Date.now()}`,
      name: `Floor ${floors.length + 1}`,
      floor_number: floors.length + 1
    };
    setFloors([...floors, newFloor]);
  };

  const removeFloor = (id: string) => {
    if (floors.length <= 1) {
      toast.error('At least one floor is required');
      return;
    }
    setFloors(floors.filter(f => f.id !== id));
    // Remove associated lanes
    setLanes(lanes.filter(l => floors.find(f => f.id === l.floor_id)?.id !== id));
  };

  const addLane = (floorId: string) => {
    const floorLanes = lanes.filter(l => l.floor_id === floorId);
    const newLane = {
      id: `lane-${Date.now()}`,
      name: `Lane ${floorLanes.length + 1}`,
      floor_id: floorId,
      lane_number: floorLanes.length + 1,
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
    setLanes([...lanes, newLane]);
  };

  const removeLane = (id: string) => {
    const lane = lanes.find(l => l.id === id);
    if (lane) {
      const floorLanes = lanes.filter(l => l.floor_id === lane.floor_id);
      if (floorLanes.length <= 1) {
        toast.error('Each floor must have at least one lane');
        return;
      }
    }
    setLanes(lanes.filter(l => l.id !== id));
  };

  const handleConfigureRacks = (laneId: string) => {
    console.log('Configuring racks for lane:', laneId);
    const selectedLane = lanes.find(l => l.id === laneId);
    console.log('Selected lane config:', selectedLane?.rack_config);
    setSelectedLaneForRacks(laneId);
    setIsRackConfigOpen(true);
  };

  const handleRackConfigSave = (config: any) => {
    console.log('Saving rack config:', config);
    setLanes(prev => {
      const updated = prev.map(lane => 
        lane.id === selectedLaneForRacks 
          ? { ...lane, rack_config: config }
          : lane
      );
      console.log('Updated lanes:', updated);
      return updated;
    });
    setSelectedLaneForRacks(null);
    toast.success('Rack configuration updated!');
  };

  const toggleDirection = (laneId: string) => {
    setLanes(prev => prev.map(lane => 
      lane.id === laneId 
        ? { ...lane, default_direction: lane.default_direction === 'left' ? 'right' : 'left' }
        : lane
    ));
  };

  const resetForm = () => {
    setWarehouseData({
      warehouse: {
        name: '',
        description: '',
        city: '',
        state: '',
        country: 'USA',
        postal_code: '',
        address: '',
        status: 'active'
      },
      floors: [],
      lanes: []
    });
    setFloors([]);
    setLanes([]);
    setCurrentStep('basic');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {isEditMode ? 'Edit Warehouse' : 'Create New Warehouse'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {['basic', 'floors', 'lanes'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-red-600 text-white' 
                    : index < ['basic', 'floors', 'lanes'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-12 h-1 mx-2 ${
                    index < ['basic', 'floors', 'lanes'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'basic' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Warehouse Name *</Label>
                    <Input
                      id="name"
                      value={warehouseData.warehouse.name}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, name: e.target.value }
                      }))}
                      placeholder="Enter warehouse name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={warehouseData.warehouse.status}
                      onValueChange={(value) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, status: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={warehouseData.warehouse.description}
                    onChange={(e) => setWarehouseData(prev => ({
                      ...prev,
                      warehouse: { ...prev.warehouse, description: e.target.value }
                    }))}
                    placeholder="Enter warehouse description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={warehouseData.warehouse.city}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, city: e.target.value }
                      }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={warehouseData.warehouse.state}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, state: e.target.value }
                      }))}
                      placeholder="Enter state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={warehouseData.warehouse.country}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, country: e.target.value }
                      }))}
                      placeholder="Enter country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={warehouseData.warehouse.postal_code}
                      onChange={(e) => setWarehouseData(prev => ({
                        ...prev,
                        warehouse: { ...prev.warehouse, postal_code: e.target.value }
                      }))}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={warehouseData.warehouse.address}
                    onChange={(e) => setWarehouseData(prev => ({
                      ...prev,
                      warehouse: { ...prev.warehouse, address: e.target.value }
                    }))}
                    placeholder="Enter full address"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleBasicInfoSave} className="bg-red-600 hover:bg-red-700">
                Next: Add Floors
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'floors' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Warehouse Floors</span>
                  <Button onClick={addFloor} size="sm" className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Floor
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {floors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No floors added yet. Click "Add Floor" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {floors.map((floor, index) => (
                      <div key={floor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <Input
                            value={floor.name}
                            onChange={(e) => setFloors(prev => 
                              prev.map(f => f.id === floor.id ? { ...f, name: e.target.value } : f)
                            )}
                            placeholder="Floor name"
                          />
                        </div>
                        <Badge variant="outline">Floor {floor.floor_number}</Badge>
                        {floors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFloor(floor.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('basic')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleFloorsSave} className="bg-red-600 hover:bg-red-700">
                Next: Add Lanes
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'lanes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Lanes & Rack Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {floors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No floors available. Please add floors first.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {floors.map((floor) => {
                      const floorLanes = lanes.filter(l => l.floor_id === floor.id);
                      return (
                        <div key={floor.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">{floor.name}</h3>
                            <Button 
                              onClick={() => addLane(floor.id)} 
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Lane
                            </Button>
                          </div>
                          
                          {floorLanes.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              Loading default lanes...
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {floorLanes.map((lane) => (
                                <div key={lane.id} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex-1">
                                      <Input
                                        value={lane.name}
                                        onChange={(e) => setLanes(prev => 
                                          prev.map(l => l.id === lane.id ? { ...l, name: e.target.value } : l)
                                        )}
                                        placeholder="Lane name"
                                      />
                                    </div>
                                    <Badge variant="outline">Lane {lane.lane_number}</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleConfigureRacks(lane.id)}
                                      className={`${lane.rack_config ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                      <Settings className="w-4 h-4 mr-1" />
                                      {lane.rack_config ? 'Configured Racks' : 'Configure Racks'}
                                    </Button>
                                    {floorLanes.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLane(lane.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Rack Configuration Preview */}
                                  <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                                      {lane.rack_config ? 'Rack Configuration' : 'Default Rack Configuration'}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="text-center">
                                        <div className="flex items-center justify-center mb-2">
                                          <ArrowLeft className="w-3 h-3 mr-1" />
                                          <span className="text-sm font-medium">Left Side</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                          {lane.rack_config?.left_racks?.slice(0, 4).map((rack) => (
                                            <div key={rack.id} className="bg-white p-2 rounded text-xs border">
                                              {rack.rack_name}
                                            </div>
                                          )) || ['A', 'B', 'C', 'D'].map((rack) => (
                                            <div key={rack} className="bg-white p-2 rounded text-xs border">
                                              {rack}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="flex items-center justify-center mb-2">
                                          <span className="text-sm font-medium">Right Side</span>
                                          <ArrowRight className="w-3 h-3 ml-1" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                          {lane.rack_config?.right_racks?.slice(0, 4).map((rack) => (
                                            <div key={rack.id} className="bg-white p-2 rounded text-xs border">
                                              {rack.rack_name}
                                            </div>
                                          )) || ['A', 'B', 'C', 'D'].map((rack) => (
                                            <div key={rack} className="bg-white p-2 rounded text-xs border">
                                              {rack}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Direction Toggle */}
                                    <div className="flex items-center justify-center mt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleDirection(lane.id)}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="text-xs">Default Direction:</span>
                                        <span className="font-medium">
                                          {lane.default_direction === 'right' ? 'Right' : 'Left'}
                                        </span>
                                        {lane.default_direction === 'right' ? (
                                          <ArrowRight className="w-3 h-3" />
                                        ) : (
                                          <ArrowLeft className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                      {lane.rack_config 
                                        ? `Configured: ${lane.rack_config.left_racks?.length || 0} left, ${lane.rack_config.right_racks?.length || 0} right racks`
                                        : 'Each lane will have 4 racks on both sides by default'
                                      }
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('floors')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleLanesSave} className="bg-red-600 hover:bg-red-700">
                {isEditMode ? 'Update Warehouse' : 'Create Warehouse'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Rack Configuration Dialog */}
    {selectedLaneForRacks && (
      <RackConfigurationDialog
        open={isRackConfigOpen}
        onOpenChange={setIsRackConfigOpen}
        laneName={lanes.find(l => l.id === selectedLaneForRacks)?.name || ''}
        floorName={floors.find(f => f.id === lanes.find(l => l.id === selectedLaneForRacks)?.floor_id)?.name || ''}
        initialConfig={lanes.find(l => l.id === selectedLaneForRacks)?.rack_config}
        onSave={handleRackConfigSave}
      />
    )}
  </>
  );
};

export default CreateWarehouseDialog; 
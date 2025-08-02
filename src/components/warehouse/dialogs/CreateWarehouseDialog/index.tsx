import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type CreateWarehouseDialogProps, type DialogStep, type Floor, type Lane, type CreateWarehouseData } from './types';
import BasicInfoStep from './BasicInfoStep';
import FloorsStep from './FloorsStep';
import LanesStep from './LanesStep';

const CreateWarehouseDialog: React.FC<CreateWarehouseDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEditMode = false
}) => {
  const [currentStep, setCurrentStep] = useState<DialogStep>('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationStatus, setValidationStatus] = useState<{
    hasDuplicates: boolean;
    isValid: boolean;
  }>({ hasDuplicates: false, isValid: true });

  // Form data
  const [warehouse, setWarehouse] = useState({
    name: '',
    description: '',
    city: '',
    state: '',
    postal_code: '',
    address: '',
    status: 'active'
  });

  const [floors, setFloors] = useState<Floor[]>([]);
  const [lanes, setLanes] = useState<Lane[]>([]);

  // Memoize the transformed data to prevent unnecessary re-computations
  const transformedInitialData = useMemo(() => {
    if (!isEditMode || !initialData) return null;

    try {
      // Handle both WarehouseWithDetails and CreateWarehouseData formats
      const isWarehouseWithDetails = 'floors' in initialData && Array.isArray(initialData.floors) && initialData.floors.length > 0 && 'lanes' in initialData.floors[0];
      
      if (isWarehouseWithDetails) {
        // Handle WarehouseWithDetails format (from database)
        const warehouseData = initialData as any;
        const warehouseInfo = {
          name: warehouseData.name || '',
          description: warehouseData.description || '',
          city: warehouseData.city || '',
          state: warehouseData.state || '',
          postal_code: warehouseData.postal_code || '',
          address: warehouseData.address || '',
          status: warehouseData.status || 'active'
        };

        // Transform floors data
        const floorsData = warehouseData.floors || [];
        const transformedFloors: Floor[] = floorsData.map((floor: any) => ({
          id: floor.id || `floor-${Date.now()}-${Math.random()}`,
          name: floor.name || `Floor ${floor.floor_number}`,
          floor_number: floor.floor_number || 1
        }));

        // Transform lanes data from nested structure
        const transformedLanes: Lane[] = floorsData.flatMap((floor: any) => 
          (floor.lanes || []).map((lane: any) => {
            const config = lane.config || {};
            const racks = lane.racks || [];
            
            // Separate left and right racks
            const leftRacks = racks
              .filter((rack: any) => rack.side === 'left')
              .map((rack: any) => ({
                id: rack.id || `rack-${Date.now()}-${Math.random()}`,
                rack_name: rack.rack_name || 'A',
                rack_number: rack.rack_number || 1
              }));
            
            const rightRacks = racks
              .filter((rack: any) => rack.side === 'right')
              .map((rack: any) => ({
                id: rack.id || `rack-${Date.now()}-${Math.random()}`,
                rack_name: rack.rack_name || 'A',
                rack_number: rack.rack_number || 1
              }));
            
            return {
              id: lane.id || `lane-${Date.now()}-${Math.random()}`,
              name: lane.name || `Lane ${lane.lane_number}`,
              lane_number: lane.lane_number || 1,
              floor_number: floor.floor_number || 1,
              description: lane.description || '',
              default_direction: config.default_direction || 'left',
              rack_config: {
                left_side_enabled: config.left_side_enabled ?? true,
                right_side_enabled: config.right_side_enabled ?? true,
                left_racks: leftRacks.length > 0 ? leftRacks : [
                  { id: '1', rack_name: 'A', rack_number: 1 },
                  { id: '2', rack_name: 'B', rack_number: 2 },
                  { id: '3', rack_name: 'C', rack_number: 3 },
                  { id: '4', rack_name: 'D', rack_number: 4 }
                ],
                right_racks: rightRacks.length > 0 ? rightRacks : [
                  { id: '5', rack_name: 'A', rack_number: 1 },
                  { id: '6', rack_name: 'B', rack_number: 2 },
                  { id: '7', rack_name: 'C', rack_number: 3 },
                  { id: '8', rack_name: 'D', rack_number: 4 }
                ]
              }
            };
          })
        );

        return { warehouseInfo, transformedFloors, transformedLanes };
      } else {
        // Handle CreateWarehouseData format (from EditWarehouseDialog transformation)
        const createData = initialData as CreateWarehouseData;
        const warehouseInfo = {
          name: createData.warehouse?.name || '',
          description: createData.warehouse?.description || '',
          city: createData.warehouse?.city || '',
          state: createData.warehouse?.state || '',
          postal_code: createData.warehouse?.postal_code || '',
          address: createData.warehouse?.address || '',
          status: createData.warehouse?.status || 'active'
        };

        // Transform floors data
        const floorsData = createData.floors || [];
        const transformedFloors: Floor[] = floorsData.map((floor: any) => ({
          id: floor.id || `floor-${Date.now()}-${Math.random()}`,
          name: floor.name || `Floor ${floor.floor_number}`,
          floor_number: floor.floor_number || 1
        }));

        // Transform lanes data
        const lanesData = createData.lanes || [];
        const transformedLanes: Lane[] = lanesData.map((lane: any) => {
          const config = lane.config || {};
          const racks = lane.racks || [];
          
          // Separate left and right racks
          const leftRacks = racks
            .filter((rack: any) => rack.side === 'left')
            .map((rack: any) => ({
              id: rack.id || `rack-${Date.now()}-${Math.random()}`,
              rack_name: rack.rack_name || 'A',
              rack_number: rack.rack_number || 1
            }));
          
          const rightRacks = racks
            .filter((rack: any) => rack.side === 'right')
            .map((rack: any) => ({
              id: rack.id || `rack-${Date.now()}-${Math.random()}`,
              rack_name: rack.rack_name || 'A',
              rack_number: rack.rack_number || 1
            }));
          
          return {
            id: lane.id || `lane-${Date.now()}-${Math.random()}`,
            name: lane.name || `Lane ${lane.lane_number}`,
            lane_number: lane.lane_number || 1,
            floor_number: lane.floor_number || 1,
            description: lane.description || '',
            default_direction: config.default_direction || 'left',
            rack_config: {
              left_side_enabled: config.left_side_enabled ?? true,
              right_side_enabled: config.right_side_enabled ?? true,
              left_racks: leftRacks.length > 0 ? leftRacks : [
                { id: '1', rack_name: 'A', rack_number: 1 },
                { id: '2', rack_name: 'B', rack_number: 2 },
                { id: '3', rack_name: 'C', rack_number: 3 },
                { id: '4', rack_name: 'D', rack_number: 4 }
              ],
              right_racks: rightRacks.length > 0 ? rightRacks : [
                { id: '5', rack_name: 'A', rack_number: 1 },
                { id: '6', rack_name: 'B', rack_number: 2 },
                { id: '7', rack_name: 'C', rack_number: 3 },
                { id: '8', rack_name: 'D', rack_number: 4 }
              ]
            }
          };
        });

        return { warehouseInfo, transformedFloors, transformedLanes };
      }
    } catch (error) {
      console.error('Error transforming initial data:', error);
      return null;
    }
  }, [isEditMode, initialData]);

  // Clean up lanes when floors are removed
  useEffect(() => {
    const validFloorNumbers = floors.map(floor => floor.floor_number);
    const validLanes = lanes.filter(lane => validFloorNumbers.includes(lane.floor_number));
    
    if (validLanes.length !== lanes.length) {
      setLanes(validLanes);
    }
  }, [floors]); // Only depend on floors to prevent infinite loops

  // Load initial data for edit mode
  useEffect(() => {
    if (transformedInitialData) {
      setWarehouse(transformedInitialData.warehouseInfo);
      setFloors(transformedInitialData.transformedFloors);
      setLanes(transformedInitialData.transformedLanes);

      // Always start at step 1 (basic) for edit mode to show the complete flow
      setCurrentStep('basic');
    }
  }, [transformedInitialData]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentStep('basic');
      setErrors({});
      if (!isEditMode) {
        setWarehouse({
          name: '',
          description: '',
          city: '',
          state: '',
          postal_code: '',
          address: '',
          status: 'active'
        });
        setFloors([]);
        setLanes([]);
      }
    }
  }, [open, isEditMode]);

  // Continuously validate for duplicate lane names
  useEffect(() => {
    if (lanes.length > 0 && floors.length > 0) {
      const duplicateErrors: string[] = [];
      let hasDuplicates = false;
      
      floors.forEach(floor => {
        const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
        // Extract just the lane name part, removing any numbering prefix
        const laneNames = floorLanes.map(lane => {
          const name = lane.name.toLowerCase().trim();
          // Remove common prefixes like "1 ", "2 ", "3 " etc.
          return name.replace(/^\d+\s+/, '');
        });
        const uniqueNames = new Set(laneNames);
        
        if (laneNames.length !== uniqueNames.size) {
          duplicateErrors.push(`Floor ${floor.floor_number} has duplicate lane names`);
          hasDuplicates = true;
        }
      });
      
      if (duplicateErrors.length > 0) {
        setErrors(prev => ({
          ...prev,
          lanes: `Duplicate lane names found: ${duplicateErrors.join('. ')}`
        }));
        setValidationStatus({ hasDuplicates: true, isValid: false });
        console.log('Duplicate lane names detected:', duplicateErrors);
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.lanes;
          return newErrors;
        });
        setValidationStatus({ hasDuplicates: false, isValid: true });
      }
    } else {
      setValidationStatus({ hasDuplicates: false, isValid: true });
    }
  }, [lanes, floors]);

  const steps: { key: DialogStep; label: string; description: string }[] = [
    { key: 'basic', label: 'Basic Info', description: 'Warehouse details' },
    { key: 'floors', label: 'Floors', description: 'Configure floors' },
    { key: 'lanes', label: 'Lanes', description: 'Configure lanes and racks' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!warehouse.name.trim()) {
          newErrors.name = 'Warehouse name is required';
        }
        break;
      case 'floors':
        if (floors.length === 0) {
          newErrors.floors = 'At least one floor is required';
        }
        break;
      case 'lanes':
        if (lanes.length === 0) {
          newErrors.lanes = 'At least one lane is required';
        } else {
          // Check for duplicate lane names within each floor
          const duplicateErrors: string[] = [];
          
          floors.forEach(floor => {
            const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
            const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
            const uniqueNames = new Set(laneNames);
            
            if (laneNames.length !== uniqueNames.size) {
              duplicateErrors.push(`Floor ${floor.floor_number} has duplicate lane names`);
            }
          });
          
          if (duplicateErrors.length > 0) {
            newErrors.lanes = `Cannot save: ${duplicateErrors.join('. ')}. Please fix duplicate lane names before saving.`;
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      // Show toast notification for validation errors
      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      }
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].key);
    }
  };

  const handleSave = async () => {
    // Validate all steps before saving, not just the current step
    const allErrors: Record<string, string> = {};

    // Validate basic info
    if (!warehouse.name.trim()) {
      allErrors.name = 'Warehouse name is required';
    }

    // Validate floors
    if (floors.length === 0) {
      allErrors.floors = 'At least one floor is required';
    }

    // Validate lanes
    if (lanes.length === 0) {
      allErrors.lanes = 'At least one lane is required';
    } else {
      // Check for duplicate lane names within each floor
      const duplicateErrors: string[] = [];
      
      floors.forEach(floor => {
        const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
        const laneNames = floorLanes.map(lane => lane.name.toLowerCase());
        const uniqueNames = new Set(laneNames);
        
        if (laneNames.length !== uniqueNames.size) {
          duplicateErrors.push(`Floor ${floor.floor_number} has duplicate lane names`);
        }
      });
      
      if (duplicateErrors.length > 0) {
        allErrors.lanes = `Cannot save: ${duplicateErrors.join('. ')}. Please fix duplicate lane names before saving.`;
      }
    }

    // Set errors and check if any exist
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Show toast notification for the first error
      const errorMessages = Object.values(allErrors);
      if (errorMessages.length > 0) {
        toast.error(errorMessages[0]);
      }
      return;
    }

    setLoading(true);
    try {
      const data = {
        warehouse: {
          ...warehouse,
          name: warehouse.name.trim()
        },
        floors: floors.map(floor => ({
          id: floor.id, // Include the ID for edit mode
          name: floor.name,
          floor_number: floor.floor_number
        })),
        lanes: lanes.map(lane => ({
          id: lane.id, // Include the ID for edit mode
          name: lane.name,
          lane_number: lane.lane_number,
          floor_number: lane.floor_number,
          config: {
            left_side_enabled: lane.rack_config.left_side_enabled,
            right_side_enabled: lane.rack_config.right_side_enabled,
            default_direction: lane.default_direction,
            default_left_racks: lane.rack_config.left_racks.length,
            default_right_racks: lane.rack_config.right_racks.length
          },
          racks: [
            ...lane.rack_config.left_racks.map(rack => ({
              id: rack.id, // Include the ID for edit mode
              side: 'left' as const,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            })),
            ...lane.rack_config.right_racks.map(rack => ({
              id: rack.id, // Include the ID for edit mode
              side: 'right' as const,
              rack_name: rack.rack_name,
              rack_number: rack.rack_number
            }))
          ]
        }))
      };

      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast.error('Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseChange = (field: string, value: string) => {
    setWarehouse(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Check if there are duplicate lane names across all floors
  const hasDuplicateLaneNames = () => {
    if (lanes.length === 0 || floors.length === 0) return false;
    
    for (const floor of floors) {
      const floorLanes = lanes.filter(lane => lane.floor_number === floor.floor_number);
      if (floorLanes.length === 0) continue;
      
      // Extract just the lane name part, removing any numbering prefix
      const laneNames = floorLanes.map(lane => {
        const name = lane.name.toLowerCase().trim();
        // Remove common prefixes like "1 ", "2 ", "3 " etc.
        return name.replace(/^\d+\s+/, '');
      });
      const uniqueNames = new Set(laneNames);
      
      // If we have more names than unique names, there are duplicates
      if (laneNames.length !== uniqueNames.size) {
        return true;
      }
    }
    return false;
  };

  // Get the reason why the save button is disabled
  const getSaveDisabledReason = () => {
    if (!warehouse.name.trim()) return 'Warehouse name is required';
    if (floors.length === 0) return 'At least one floor is required';
    if (lanes.length === 0) return 'At least one lane is required';
    if (hasDuplicateLaneNames()) return 'Duplicate lane names found across floors';
    return '';
  };

  // Check if the save button should be disabled
  const isSaveDisabled = () => {
    // Basic validation checks
    if (!warehouse.name.trim()) return true;
    if (floors.length === 0) return true;
    if (lanes.length === 0) return true;
    
    // Check for duplicate lane names using validation status
    if (validationStatus.hasDuplicates) {
      console.log('Duplicate lane names detected via validation status, save button should be disabled');
      return true;
    }
    
    return false;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <BasicInfoStep
            warehouse={warehouse}
            onWarehouseChange={handleWarehouseChange}
            errors={errors}
          />
        );
      case 'floors':
        return (
          <FloorsStep
            floors={floors}
            onFloorsChange={setFloors}
            errors={errors}
          />
        );
      case 'lanes':
        return (
          <LanesStep
            lanes={lanes}
            floors={floors}
            onLanesChange={setLanes}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Warehouse' : 'Create New Warehouse'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStepIndex
                    ? 'bg-green-500 text-white'
                    : index === currentStepIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            {currentStepIndex === steps.length - 1 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={loading || isSaveDisabled()}
                      className="flex items-center gap-2"
                    >
                      {loading ? 'Saving...' : (isEditMode ? 'Update Warehouse' : 'Create Warehouse')}
                    </Button>
                  </TooltipTrigger>
                  {(isSaveDisabled() || loading) && (
                    <TooltipContent>
                      <p>{loading ? 'Saving...' : getSaveDisabledReason()}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWarehouseDialog; 
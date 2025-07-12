import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateZone, useUpdateZone } from '@/hooks/useMasters';
import { useStates, useCitiesByState } from '@/hooks/useStates';
import { Zone } from '@/services/mastersService';
import { createZoneLocation, deleteZoneLocation } from '@/services/mastersService';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.string(),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface Location {
  id?: string;
  state: string;
  city: string;
}

interface ZoneDialogProps {
  zone?: Zone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ZoneDialog = ({ zone, open, onOpenChange }: ZoneDialogProps) => {
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>(
    zone?.locations?.map(loc => ({ id: loc.id, state: loc.state, city: loc.city })) || []
  );
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  const { data: states, isLoading: statesLoading } = useStates();
  const { data: cities, isLoading: citiesLoading } = useCitiesByState(selectedStateId);

  const form = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: zone?.name || '',
      status: zone?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (zone) {
      form.reset({
        name: zone.name,
        status: zone.status,
      });
      setLocations(zone.locations?.map(loc => ({ id: loc.id, state: loc.state, city: loc.city })) || []);
    } else {
      form.reset({
        name: '',
        status: 'active',
      });
      setLocations([]);
    }
    setSelectedStateId('');
    setSelectedCityId('');
  }, [zone, form]);

  const addLocation = () => {
    if (selectedStateId && selectedCityId) {
      const selectedState = states?.find(s => s.id === selectedStateId);
      const selectedCity = cities?.find(c => c.id === selectedCityId);
      
      if (selectedState && selectedCity) {
        const newLocation = {
          state: selectedState.name,
          city: selectedCity.name,
        };
        
        // Check if this location combination already exists
        const exists = locations.some(loc => 
          loc.state === newLocation.state && loc.city === newLocation.city
        );
        
        if (!exists) {
          setLocations([...locations, newLocation]);
          setSelectedStateId('');
          setSelectedCityId('');
        } else {
          toast({
            title: "Location already exists",
            description: "This state and city combination is already added.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const removeLocation = async (index: number) => {
    const location = locations[index];
    if (location.id && zone) {
      try {
        await deleteZoneLocation(location.id);
        toast({
          title: "Success",
          description: "Location removed successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove location",
          variant: "destructive",
        });
        return;
      }
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ZoneFormData) => {
    try {
      const zoneData = {
        name: data.name,
        status: data.status,
        warehouse_assignments: zone?.warehouse_assignments || [],
      };

      let savedZone: Zone;
      if (zone) {
        savedZone = await updateZone.mutateAsync({
          id: zone.id,
          updates: zoneData,
        });
      } else {
        savedZone = await createZone.mutateAsync(zoneData);
      }

      console.log('Zone saved:', savedZone);

      // Handle locations - delete existing ones and create new ones for updates
      if (zone) {
        // For updates, remove all existing locations first
        const existingLocations = zone.locations || [];
        for (const existingLocation of existingLocations) {
          try {
            await deleteZoneLocation(existingLocation.id);
          } catch (error) {
            console.error('Error deleting existing location:', error);
          }
        }
      }

      // Create all current locations
      for (const location of locations) {
        try {
          await createZoneLocation({
            zone_id: savedZone.id,
            state: location.state,
            city: location.city,
          });
          console.log('Location created:', location);
        } catch (error) {
          console.error('Error creating location:', error);
          toast({
            title: "Warning",
            description: `Failed to save location: ${location.state}, ${location.city}`,
            variant: "destructive",
          });
        }
      }

      console.log('All operations completed, closing dialog');
      
      // Invalidate zones query to refresh the data in the UI
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      
      // Reset form and close dialog
      form.reset();
      setLocations([]);
      setSelectedStateId('');
      setSelectedCityId('');
      onOpenChange(false);

    } catch (error) {
      console.error('Error saving zone:', error);
      toast({
        title: "Error",
        description: "Failed to save zone",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {zone ? 'Edit Zone' : 'Add New Zone'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter zone name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Locations</h3>
              
              {/* Add New Location */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Add Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Select 
                      value={selectedStateId} 
                      onValueChange={(value) => {
                        setSelectedStateId(value);
                        setSelectedCityId(''); // Reset city when state changes
                      }}
                      disabled={statesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={statesLoading ? "Loading states..." : "Select state"} />
                      </SelectTrigger>
                      <SelectContent>
                        {states?.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Select 
                      value={selectedCityId} 
                      onValueChange={setSelectedCityId}
                      disabled={!selectedStateId || citiesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedStateId ? "Select state first" : 
                          citiesLoading ? "Loading cities..." : 
                          "Select city"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {cities?.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addLocation}
                  disabled={!selectedStateId || !selectedCityId}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>

              {/* Existing Locations */}
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="flex-1">{location.state}, {location.city}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLocation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No locations added yet.</p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createZone.isPending || updateZone.isPending}
              >
                {zone ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ZoneDialog;

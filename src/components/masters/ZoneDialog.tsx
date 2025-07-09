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
import { Zone } from '@/services/mastersService';
import { createZoneLocation, deleteZoneLocation } from '@/services/mastersService';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: z.enum(['active', 'inactive']),
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
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>(
    zone?.locations?.map(loc => ({ id: loc.id, state: loc.state, city: loc.city })) || []
  );
  const [newLocation, setNewLocation] = useState<Location>({ state: '', city: '' });

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
  }, [zone, form]);

  const addLocation = () => {
    if (newLocation.state && newLocation.city) {
      setLocations([...locations, { ...newLocation }]);
      setNewLocation({ state: '', city: '' });
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
        code: null,
        description: null,
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

      // Add new locations that don't have IDs
      const newLocations = locations.filter(loc => !loc.id);
      for (const location of newLocations) {
        await createZoneLocation({
          zone_id: savedZone.id,
          state: location.state,
          city: location.city,
        });
      }

      onOpenChange(false);
      form.reset();
      setLocations([]);
    } catch (error) {
      console.error('Error saving zone:', error);
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
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={newLocation.state}
                    onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={newLocation.city}
                    onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addLocation}
                  disabled={!newLocation.state || !newLocation.city}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Existing Locations */}
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
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
                <p className="text-sm text-muted-foreground">No locations added yet.</p>
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

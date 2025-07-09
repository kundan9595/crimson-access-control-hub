
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateZone, useUpdateZone } from '@/hooks/useMasters';
import { Zone } from '@/services/mastersService';

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface ZoneDialogProps {
  zone?: Zone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ZoneDialog = ({ zone, open, onOpenChange }: ZoneDialogProps) => {
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();

  const form = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: zone?.name || '',
      code: zone?.code || '',
      description: zone?.description || '',
      status: zone?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (zone) {
      form.reset({
        name: zone.name,
        code: zone.code,
        description: zone.description || '',
        status: zone.status,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        status: 'active',
      });
    }
  }, [zone, form]);

  const onSubmit = async (data: ZoneFormData) => {
    try {
      const zoneData = {
        ...data,
        warehouse_assignments: zone?.warehouse_assignments || [],
      };

      if (zone) {
        await updateZone.mutateAsync({
          id: zone.id,
          updates: zoneData,
        });
      } else {
        await createZone.mutateAsync(zoneData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving zone:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {zone ? 'Edit Zone' : 'Add New Zone'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter zone name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter zone code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter description (optional)" />
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

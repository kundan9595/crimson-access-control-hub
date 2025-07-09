
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
import { useCreateSizeGroup, useUpdateSizeGroup } from '@/hooks/useMasters';
import { SizeGroup } from '@/services/mastersService';

const sizeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type SizeGroupFormData = z.infer<typeof sizeGroupSchema>;

interface SizeGroupDialogProps {
  sizeGroup?: SizeGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SizeGroupDialog = ({ sizeGroup, open, onOpenChange }: SizeGroupDialogProps) => {
  const createSizeGroup = useCreateSizeGroup();
  const updateSizeGroup = useUpdateSizeGroup();

  const form = useForm<SizeGroupFormData>({
    resolver: zodResolver(sizeGroupSchema),
    defaultValues: {
      name: sizeGroup?.name || '',
      description: sizeGroup?.description || '',
      status: sizeGroup?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (sizeGroup) {
      form.reset({
        name: sizeGroup.name,
        description: sizeGroup.description || '',
        status: sizeGroup.status,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'active',
      });
    }
  }, [sizeGroup, form]);

  const onSubmit = async (data: SizeGroupFormData) => {
    try {
      const sizeGroupData = {
        name: data.name,
        description: data.description || null,
        status: data.status,
      };

      if (sizeGroup) {
        await updateSizeGroup.mutateAsync({
          id: sizeGroup.id,
          updates: sizeGroupData,
        });
      } else {
        await createSizeGroup.mutateAsync(sizeGroupData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving size group:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sizeGroup ? 'Edit Size Group' : 'Add New Size Group'}
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
                    <Input {...field} placeholder="Enter size group name" />
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
                disabled={createSizeGroup.isPending || updateSizeGroup.isPending}
              >
                {sizeGroup ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGroupDialog;

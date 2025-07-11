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
import { useCreatePriceType, useUpdatePriceType } from '@/hooks/useMasters';
import { PriceType } from '@/services/mastersService';

const priceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.string(),
});

type PriceTypeFormData = z.infer<typeof priceTypeSchema>;

interface PriceTypeDialogProps {
  priceType?: PriceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PriceTypeDialog = ({ priceType, open, onOpenChange }: PriceTypeDialogProps) => {
  const createPriceType = useCreatePriceType();
  const updatePriceType = useUpdatePriceType();

  const form = useForm<PriceTypeFormData>({
    resolver: zodResolver(priceTypeSchema),
    defaultValues: {
      name: priceType?.name || '',
      description: priceType?.description || '',
      status: priceType?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (priceType) {
      form.reset({
        name: priceType.name,
        description: priceType.description || '',
        status: priceType.status,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'active',
      });
    }
  }, [priceType, form]);

  const onSubmit = async (data: PriceTypeFormData) => {
    try {
      const priceTypeData = {
        name: data.name,
        description: data.description || null,
        status: data.status,
      };

      if (priceType) {
        await updatePriceType.mutateAsync({
          id: priceType.id,
          updates: priceTypeData,
        });
      } else {
        await createPriceType.mutateAsync(priceTypeData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving price type:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {priceType ? 'Edit Price Type' : 'Add New Price Type'}
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
                    <Input {...field} placeholder="Enter price type name" />
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
                disabled={createPriceType.isPending || updatePriceType.isPending}
              >
                {priceType ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceTypeDialog;

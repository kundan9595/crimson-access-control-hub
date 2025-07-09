
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePriceType, useUpdatePriceType } from '@/hooks/useMasters';
import { PriceType } from '@/services/mastersService';

const priceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  is_default: z.boolean().optional(),
  multiplier: z.number().positive('Multiplier must be positive').optional(),
  status: z.enum(['active', 'inactive']),
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
      code: priceType?.code || '',
      description: priceType?.description || '',
      is_default: priceType?.is_default || false,
      multiplier: priceType?.multiplier || 1,
      status: priceType?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (priceType) {
      form.reset({
        name: priceType.name,
        code: priceType.code,
        description: priceType.description || '',
        is_default: priceType.is_default || false,
        multiplier: priceType.multiplier || 1,
        status: priceType.status,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        is_default: false,
        multiplier: 1,
        status: 'active',
      });
    }
  }, [priceType, form]);

  const onSubmit = async (data: PriceTypeFormData) => {
    try {
      if (priceType) {
        await updatePriceType.mutateAsync({
          id: priceType.id,
          updates: data,
        });
      } else {
        await createPriceType.mutateAsync(data);
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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter price type code" />
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
              name="multiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Multiplier</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.0001"
                      placeholder="Enter multiplier"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Default Price Type</FormLabel>
                  </div>
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

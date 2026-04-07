import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSize, useUpdateSize, useAllSizes } from '@/hooks/masters/useSizes';
import { useAllSizeTypes } from '@/hooks/masters/useSizeTypes';
import { Size } from '@/services/masters/types';

const sizeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  size_type_id: z.string().min(1, 'Size Type is required'),
  status: z.enum(['active', 'inactive']),
  sort_order: z.coerce.number().optional(),
});

type SizeFormData = z.infer<typeof sizeSchema>;

interface SizeDialogProps {
  size?: Size | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SizeDialog = ({ size, open, onOpenChange }: SizeDialogProps) => {
  const createSize = useCreateSize();
  const updateSize = useUpdateSize();
  const { data: allSizes } = useAllSizes();
  const { data: sizeTypes } = useAllSizeTypes();

  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeSchema),
    defaultValues: {
      name: size?.name || '',
      code: size?.code || '',
      size_type_id: size?.size_group_id || '',
      status: (size?.status as 'active' | 'inactive') || 'active',
      sort_order: size?.sort_order ?? 0,
    },
  });

  React.useEffect(() => {
    if (size) {
      form.reset({
        name: size.name,
        code: size.code || '',
        size_type_id: size.size_group_id,
        status: size.status as 'active' | 'inactive',
        sort_order: size.sort_order ?? 0,
      });
    } else {
      // Calculate next sort order for new sizes
      const maxSortOrder = allSizes?.length
        ? Math.max(...allSizes.map((s) => s.sort_order || 0))
        : -1;

      form.reset({
        name: '',
        code: '',
        size_type_id: '',
        status: 'active',
        sort_order: maxSortOrder + 1,
      });
    }
  }, [size, allSizes, form]);

  const onSubmit = async (data: SizeFormData) => {
    try {
      const sizeData = {
        name: data.name,
        code: data.code || data.name,
        size_group_id: data.size_type_id,
        sort_order: data.sort_order ?? 0,
        status: data.status,
      };

      if (size) {
        await updateSize.mutateAsync({
          id: size.id,
          updates: sizeData,
        });
      } else {
        await createSize.mutateAsync(sizeData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving size:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{size ? 'Edit Size' : 'Add New Size'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter size name (e.g., XS, S, M, L, 32, 34)" />
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
                  <FormLabel>Size Code (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter size code (e.g., xs, s, m, l)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="size_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a size type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sizeTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Enter sort order (e.g., 1, 2, 3)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSize.isPending || updateSize.isPending}>
                {size ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SizeDialog;

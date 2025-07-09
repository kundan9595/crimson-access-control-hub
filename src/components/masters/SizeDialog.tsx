
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSize, useUpdateSize } from '@/hooks/useMasters';
import { Size } from '@/services/mastersService';

const sizeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  sort_order: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive']),
});

type SizeFormData = z.infer<typeof sizeSchema>;

interface SizeDialogProps {
  size?: Size | null;
  sizeGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SizeDialog = ({ size, sizeGroupId, open, onOpenChange }: SizeDialogProps) => {
  const createSize = useCreateSize();
  const updateSize = useUpdateSize();

  const form = useForm<SizeFormData>({
    resolver: zodResolver(sizeSchema),
    defaultValues: {
      name: size?.name || '',
      code: size?.code || '',
      sort_order: size?.sort_order || 0,
      status: size?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (size) {
      form.reset({
        name: size.name,
        code: size.code,
        sort_order: size.sort_order || 0,
        status: size.status,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        sort_order: 0,
        status: 'active',
      });
    }
  }, [size, form]);

  const onSubmit = async (data: SizeFormData) => {
    try {
      const sizeData = {
        name: data.name,
        code: data.code,
        size_group_id: sizeGroupId,
        sort_order: data.sort_order || null,
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
          <DialogTitle>
            {size ? 'Edit Size' : 'Add New Size'}
          </DialogTitle>
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
                    <Input {...field} placeholder="Enter size name (e.g., XS, S, M, L)" />
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
                  <FormLabel>Size Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter size code (e.g., xs, s, m, l)" />
                  </FormControl>
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
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="Enter sort order (0, 1, 2...)"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
                disabled={createSize.isPending || updateSize.isPending}
              >
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

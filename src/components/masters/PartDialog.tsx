import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { Part } from '@/hooks/masters/useParts';

const partSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  order_criteria: z.boolean().default(false),
  sort_position: z.coerce.number().min(0).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

type PartFormData = z.infer<typeof partSchema>;

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: Part;
  onSubmit: (data: PartFormData) => void;
  isSubmitting?: boolean;
}

export const PartDialog: React.FC<PartDialogProps> = ({
  open,
  onOpenChange,
  part,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: '',
      order_criteria: false,
      sort_position: 0,
      status: 'active',
    },
  });

  useEffect(() => {
    if (part) {
      form.reset({
        name: part.name,
        order_criteria: part.order_criteria,
        sort_position: part.sort_position,
        status: part.status as 'active' | 'inactive',
      });
    } else {
      form.reset({
        name: '',
        order_criteria: false,
        sort_position: 0,
        status: 'active',
      });
    }
  }, [part, form]);

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={part ? 'Edit Part' : 'Add Part'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      isEditing={!!part}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter part name (e.g., Collar, Sleeves, Pocket)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="order_criteria"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Order Criteria</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Mark if this part is used for order criteria
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Position</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter sort position"
                  {...field}
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
      </div>
    </BaseFormDialog>
  );
};

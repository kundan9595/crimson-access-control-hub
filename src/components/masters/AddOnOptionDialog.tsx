
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ui/ImageUpload';
import { useCreateAddOnOption, useUpdateAddOnOption } from '@/hooks/masters/useAddOns';
import { AddOn, AddOnOption } from '@/services/masters/addOnsService';

const optionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').default(0),
  display_order: z.number().int().min(0).default(0),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

type OptionFormData = z.infer<typeof optionSchema>;

interface AddOnOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addOn: AddOn | null;
  option?: AddOnOption | null;
}

export const AddOnOptionDialog: React.FC<AddOnOptionDialogProps> = ({
  open,
  onOpenChange,
  addOn,
  option,
}) => {
  const createOptionMutation = useCreateAddOnOption();
  const updateOptionMutation = useUpdateAddOnOption();

  const form = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      display_order: 0,
      image_url: '',
      status: 'active',
    },
  });

  // Reset form values when option changes or dialog opens
  useEffect(() => {
    if (open) {
      if (option) {
        // Editing existing option
        form.reset({
          name: option.name || '',
          description: option.description || '',
          price: option.price || 0,
          display_order: option.display_order || 0,
          image_url: option.image_url || '',
          status: option.status || 'active',
        });
      } else {
        // Creating new option
        form.reset({
          name: '',
          description: '',
          price: 0,
          display_order: 0,
          image_url: '',
          status: 'active',
        });
      }
    }
  }, [option, open, form]);

  const handleSubmit = async (data: OptionFormData) => {
    if (!addOn) return;

    if (option) {
      updateOptionMutation.mutate(
        { id: option.id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      // Ensure name is provided when creating
      const optionData = {
        ...data,
        add_on_id: addOn.id,
        name: data.name, // Explicitly ensure name is included
      };
      createOptionMutation.mutate(
        optionData,
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  if (!addOn) return null;

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={option ? 'Edit Option' : 'Create Option'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={createOptionMutation.isPending || updateOptionMutation.isPending}
      isEditing={!!option}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter option name" {...field} />
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
                <Textarea
                  placeholder="Enter option description"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                  placeholder="Upload option image"
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
              <Select onValueChange={field.onChange} value={field.value}>
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

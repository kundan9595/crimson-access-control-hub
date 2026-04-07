import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AddOn } from '@/hooks/masters/useAddOns';

const addOnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  select_type: z.enum(['single', 'multiple', 'checked'], {
    required_error: 'Select type is required',
  }),
  sort_order: z.coerce.number().int().min(0).default(0),
  layer_sort: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  add_on_of: z.coerce.number().min(0).default(0),
  add_on_sn: z.coerce.number().min(0).default(0),
  has_color: z.boolean().default(false),
  group_name: z.string().default(''),
  price: z.coerce.number().min(0).default(0),
});

type AddOnFormData = z.infer<typeof addOnSchema>;

interface AddOnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddOnFormData, imageFile?: File) => void;
  addOn?: AddOn | null;
  isSubmitting?: boolean;
}

export const AddOnDialog: React.FC<AddOnDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  addOn,
  isSubmitting = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);

  const form = useForm<AddOnFormData>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: '',
      select_type: 'single',
      sort_order: 0,
      layer_sort: 0,
      status: 'active',
      add_on_of: 0,
      add_on_sn: 0,
      has_color: false,
      group_name: '',
      price: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (addOn) {
        form.reset({
          name: addOn.name || '',
          select_type: (addOn.select_type as 'single' | 'multiple' | 'checked') || 'single',
          sort_order: addOn.sort_order || 0,
          layer_sort: addOn.layer_sort || 0,
          status: addOn.status as 'active' | 'inactive',
          add_on_of: addOn.add_on_of || 0,
          add_on_sn: addOn.add_on_sn || 0,
          has_color: addOn.has_color || false,
          group_name: addOn.group_name || '',
          price: addOn.price || 0,
        });
      } else {
        form.reset({
          name: '',
          select_type: 'single',
          sort_order: 0,
          layer_sort: 0,
          status: 'active',
          add_on_of: 0,
          add_on_sn: 0,
          has_color: false,
          group_name: '',
          price: 0,
        });
        setSelectedImage(undefined);
      }
    }
  }, [addOn, open, form]);

  const handleSubmit = (data: AddOnFormData) => {
    onSubmit(data, selectedImage);
    setSelectedImage(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={addOn ? 'Edit Add On' : 'Create Add On'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEditing={!!addOn}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter add-on name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="group_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter group name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="add_on_of"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add On OF</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="add_on_sn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add On SN</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="select_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Single Select</SelectItem>
                    <SelectItem value="multiple">Multiple Select</SelectItem>
                    <SelectItem value="checked">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort Order</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="layer_sort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Layer Sort</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="has_color"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Has Color</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Enable color variations for this add-on
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Image</FormLabel>
          <FormControl>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </FormControl>
          {selectedImage && (
            <p className="text-sm text-muted-foreground mt-1">
              Selected: {selectedImage.name}
            </p>
          )}
          <FormMessage />
        </FormItem>

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

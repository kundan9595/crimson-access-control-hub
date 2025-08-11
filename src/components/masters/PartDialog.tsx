
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Part } from '@/services/masters/partsService';
import { useAddOns, useColors } from '@/hooks/masters';
import { ScrollArea } from '@/components/ui/scroll-area';

const partSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  selected_add_ons: z.array(z.string()).default([]),
  selected_colors: z.array(z.string()).default([]),
  order_criteria: z.boolean().default(false),
  sort_position: z.number().min(0).default(0),
  status: z.string().default('active'),
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
  // PartDialog - Rendering with part
  
  const { data: addOns = [] } = useAddOns();
  const { data: colors = [] } = useColors();
  
  const form = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      name: '',
      selected_add_ons: [],
      selected_colors: [],
      order_criteria: false,
      sort_position: 0,
      status: 'active',
    },
  });

  useEffect(() => {
    // PartDialog - Resetting form with part
    if (part) {
      form.reset({
        name: part.name,
        selected_add_ons: part.selected_add_ons || [],
        selected_colors: part.selected_colors || [],
        order_criteria: part.order_criteria,
        sort_position: part.sort_position,
        status: part.status,
      });
    } else {
      form.reset({
        name: '',
        selected_add_ons: [],
        selected_colors: [],
        order_criteria: false,
        sort_position: 0,
        status: 'active',
      });
    }
  }, [part, form]);

  const handleAddOnChange = (addOnId: string, checked: boolean) => {
    const currentAddOns = form.getValues('selected_add_ons');
    if (checked) {
      form.setValue('selected_add_ons', [...currentAddOns, addOnId]);
    } else {
      form.setValue('selected_add_ons', currentAddOns.filter(id => id !== addOnId));
    }
  };

  const handleColorChange = (colorId: string, checked: boolean) => {
    const currentColors = form.getValues('selected_colors');
    if (checked) {
      form.setValue('selected_colors', [...currentColors, colorId]);
    } else {
      form.setValue('selected_colors', currentColors.filter(id => id !== colorId));
    }
  };

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
                <Input placeholder="Enter part name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selected_add_ons"
          render={() => (
            <FormItem>
              <FormLabel>Add-ons</FormLabel>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {addOns.map((addOn) => (
                    <div key={addOn.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`addon-${addOn.id}`}
                        checked={form.watch('selected_add_ons').includes(addOn.id)}
                        onCheckedChange={(checked) => handleAddOnChange(addOn.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`addon-${addOn.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {addOn.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selected_colors"
          render={() => (
            <FormItem>
              <FormLabel>Colors</FormLabel>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {colors.map((color) => (
                    <div key={color.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`color-${color.id}`}
                        checked={form.watch('selected_colors').includes(color.id)}
                        onCheckedChange={(checked) => handleColorChange(color.id, checked as boolean)}
                      />
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        <label
                          htmlFor={`color-${color.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {color.name}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </BaseFormDialog>
  );
};


import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/ui/ImageUpload';
import { AddOn } from '@/services/masters/addOnsService';
import { useColors } from '@/hooks/masters/useColors';

const addOnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  select_type: z.enum(['single', 'multiple', 'checked'], {
    required_error: 'Select type is required',
  }),
  sort_order: z.number().int().min(0).default(0),
  image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
  add_on_of: z.number().min(0).optional(),
  add_on_sn: z.number().min(0).optional(),
  has_colour: z.boolean().default(false),
  group_name: z.string().optional(),
  price: z.number().min(0).optional(),
  selected_color_id: z.string().optional(), // Form-only field for color selection
});

type AddOnFormData = z.infer<typeof addOnSchema>;

interface AddOnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void; // Updated to any since we transform the data
  addOn?: AddOn;
  isSubmitting?: boolean;
}

export const AddOnDialog: React.FC<AddOnDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  addOn,
  isSubmitting = false,
}) => {
  console.log('🎪 AddOnDialog - Render with props:', {
    open,
    addOn: addOn?.id || null,
    isSubmitting
  });

  const { data: colors = [], isLoading: colorsLoading } = useColors();

  const form = useForm<AddOnFormData>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      name: '',
      select_type: 'single',
      sort_order: 0,
      image_url: '',
      status: 'active',
      add_on_of: 0,
      add_on_sn: 0,
      has_colour: false,
      group_name: '',
      price: 0,
      selected_color_id: 'none',
    },
  });

  // Reset form values when addOn changes or dialog opens
  useEffect(() => {
    console.log('🔄 AddOnDialog - useEffect triggered, open:', open, 'addOn:', addOn?.id || null);
    if (open) {
      if (addOn) {
        // Editing existing add-on
        console.log('✏️ AddOnDialog - Resetting form for editing');
        
        // Find the selected color ID from the colors array
        let selectedColorId = 'none';
        if (addOn.has_colour && addOn.colors && addOn.colors.length > 0) {
          selectedColorId = addOn.colors[0].id; // Use first color if multiple
        }
        
        form.reset({
          name: addOn.name || '',
          select_type: addOn.select_type || 'single',
          sort_order: addOn.sort_order || 0,
          image_url: addOn.image_url || '',
          status: addOn.status || 'active',
          add_on_of: addOn.add_on_of || 0,
          add_on_sn: addOn.add_on_sn || 0,
          has_colour: addOn.has_colour || false,
          group_name: addOn.group_name || '',
          price: addOn.price || 0,
          selected_color_id: selectedColorId,
        });
      } else {
        // Creating new add-on
        console.log('➕ AddOnDialog - Resetting form for creating');
        form.reset({
          name: '',
          select_type: 'single',
          sort_order: 0,
          image_url: '',
          status: 'active',
          add_on_of: 0,
          add_on_sn: 0,
          has_colour: false,
          group_name: '',
          price: 0,
          selected_color_id: 'none',
        });
      }
    }
  }, [addOn, open, form]);

  const handleSubmit = (data: AddOnFormData) => {
    console.log('📝 AddOnDialog - handleSubmit called with data:', data);
    
    // Transform the form data to match the database schema
    const { selected_color_id, ...restData } = data;
    
    // Build the colors array based on selection
    let colorsArray: any[] = [];
    if (data.has_colour && selected_color_id && selected_color_id !== 'none') {
      const selectedColor = colors.find(color => color.id === selected_color_id);
      if (selectedColor) {
        colorsArray = [{
          id: selectedColor.id,
          name: selectedColor.name,
          hex_code: selectedColor.hex_code
        }];
      }
    }
    
    const submitData = {
      ...restData,
      colors: colorsArray,
      options: [], // Initialize with empty options array
    };

    console.log('📝 AddOnDialog - Submitting transformed data:', submitData);
    onSubmit(submitData);
  };

  const hasColourValue = form.watch('has_colour');

  console.log('🎨 AddOnDialog - About to render BaseFormDialog, open:', open);

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
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                <FormLabel>Add On Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
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
          name="has_colour"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Has Colour</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Enable color variations for this add-on
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {hasColourValue && (
          <FormField
            control={form.control}
            name="selected_color_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorsLoading ? (
                      <SelectItem value="loading" disabled>Loading colors...</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="none">No color selected</SelectItem>
                        {colors.map((color) => (
                          <SelectItem key={color.id} value={color.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300" 
                                style={{ backgroundColor: color.hex_code }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                  placeholder="Upload add-on image"
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

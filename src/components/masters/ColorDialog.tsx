import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateColor, useUpdateColor } from '@/hooks/masters/useColors';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { Color } from '@/services/mastersService';

const colorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hex_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex code (e.g., #FF0000)'),
  status: z.string(),
});

type ColorFormData = z.infer<typeof colorSchema>;

type ColorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color?: Color | null;
};

const ColorDialog: React.FC<ColorDialogProps> = ({ open, onOpenChange, color }) => {
  const createColorMutation = useCreateColor();
  const updateColorMutation = useUpdateColor();
  const isEditing = !!color;

  const form = useForm<ColorFormData>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      name: color?.name || '',
      hex_code: color?.hex_code || '#000000',
      status: color?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (color && open) {
      form.reset({
        name: color.name,
        hex_code: color.hex_code,
        status: color.status,
      });
    } else if (!color && open) {
      form.reset({
        name: '',
        hex_code: '#000000',
        status: 'active',
      });
    }
  }, [color, open, form]);

  const onSubmit = (data: ColorFormData) => {
    const colorData = {
      name: data.name,
      hex_code: data.hex_code,
      status: data.status,
    };

    if (isEditing && color) {
      updateColorMutation.mutate(
        { id: color.id, updates: colorData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createColorMutation.mutate(colorData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    }
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Color' : 'Create Color'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createColorMutation.isPending || updateColorMutation.isPending}
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter color name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hex_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hex Code *</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input {...field} placeholder="#000000" />
                <div
                  className="w-10 h-10 rounded border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: field.value }}
                />
              </div>
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
            <FormControl>
              <div className="flex items-center space-x-4">
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="active"
                    checked={field.value === 'active'}
                    onChange={() => field.onChange('active')}
                  />
                  <span>Active</span>
                </Label>
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="inactive"
                    checked={field.value === 'inactive'}
                    onChange={() => field.onChange('inactive')}
                  />
                  <span>Inactive</span>
                </Label>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </BaseFormDialog>
  );
};

export default ColorDialog;

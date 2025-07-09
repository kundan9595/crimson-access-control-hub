
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { useCreateColor, useUpdateColor } from '@/hooks/useMasters';
import type { Color } from '@/services/mastersService';

type ColorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color?: Color | null;
};

type ColorFormData = {
  name: string;
  hex_code: string;
  status: 'active' | 'inactive';
};

const ColorDialog: React.FC<ColorDialogProps> = ({ open, onOpenChange, color }) => {
  const createColorMutation = useCreateColor();
  const updateColorMutation = useUpdateColor();
  const isEditing = !!color;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ColorFormData>({
    defaultValues: {
      name: color?.name || '',
      hex_code: color?.hex_code || '#000000',
      status: color?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (color && open) {
      reset({
        name: color.name,
        hex_code: color.hex_code,
        status: color.status,
      });
    } else if (!color && open) {
      reset({
        name: '',
        hex_code: '#000000',
        status: 'active',
      });
    }
  }, [color, open, reset]);

  const onSubmit = (data: ColorFormData) => {
    const colorData = {
      name: data.name,
      hex_code: data.hex_code,
      status: data.status,
    };

    if (isEditing) {
      updateColorMutation.mutate(
        { id: color.id, updates: colorData },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          }
        }
      );
    } else {
      createColorMutation.mutate(colorData, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        }
      });
    }
  };

  const statusValue = watch('status');
  const hexValue = watch('hex_code');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Color' : 'Create Color'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter color name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hex_code">Hex Code *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="hex_code"
                {...register('hex_code', { 
                  required: 'Hex code is required',
                  pattern: {
                    value: /^#[0-9A-Fa-f]{6}$/,
                    message: 'Please enter a valid hex code (e.g., #FF0000)'
                  }
                })}
                placeholder="#000000"
              />
              <div
                className="w-10 h-10 rounded border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: hexValue }}
              />
            </div>
            {errors.hex_code && (
              <p className="text-sm text-destructive">{errors.hex_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup
              value={statusValue}
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createColorMutation.isPending || updateColorMutation.isPending}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ColorDialog;


import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ui/ImageUpload';
import { useCreateFabric, useUpdateFabric } from '@/hooks/masters/useFabrics';
import { useColors } from '@/hooks/masters/useColors';
import { Fabric } from '@/services/masters/types';

const fabricSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fabric_type: z.enum(['Cotton', 'Poly Cotton', 'Polyester'], {
    required_error: 'Fabric type is required',
  }),
  gsm: z.number().min(1, 'GSM must be greater than 0'),
  uom: z.enum(['kg', 'meter'], {
    required_error: 'Unit of measure is required',
  }),
  price: z.number().min(0, 'Price must be non-negative'),
  color_id: z.string().optional(),
  image_url: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

type FabricFormData = z.infer<typeof fabricSchema>;

// Type for create mutation that ensures all required fields are present
type CreateFabricData = {
  name: string;
  fabric_type: 'Cotton' | 'Poly Cotton' | 'Polyester';
  gsm: number;
  uom: 'kg' | 'meter';
  price: number;
  color_id?: string;
  image_url?: string;
  status: string;
};

interface FabricDialogProps {
  fabric?: Fabric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FabricDialog: React.FC<FabricDialogProps> = ({
  fabric,
  open,
  onOpenChange,
}) => {
  const createFabric = useCreateFabric();
  const updateFabric = useUpdateFabric();
  const { data: colors = [] } = useColors();

  const form = useForm<FabricFormData>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      name: fabric?.name || '',
      fabric_type: fabric?.fabric_type || 'Cotton',
      gsm: fabric?.gsm || 100,
      uom: fabric?.uom || 'kg',
      price: fabric?.price || 0,
      color_id: fabric?.color_id || undefined,
      image_url: fabric?.image_url || '',
      status: fabric?.status || 'active',
    },
  });

  const onSubmit = async (data: FabricFormData) => {
    try {
      if (fabric) {
        await updateFabric.mutateAsync({
          id: fabric.id,
          updates: data,
        });
      } else {
        // Ensure all required fields are present for creation
        const createData: CreateFabricData = {
          name: data.name,
          fabric_type: data.fabric_type,
          gsm: data.gsm,
          uom: data.uom,
          price: data.price,
          status: data.status,
          ...(data.color_id && { color_id: data.color_id }),
          ...(data.image_url && { image_url: data.image_url }),
        };
        await createFabric.mutateAsync(createData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save fabric:', error);
    }
  };

  const isLoading = createFabric.isPending || updateFabric.isPending;

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={fabric ? 'Edit Fabric' : 'Add Fabric'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isLoading}
      isEditing={!!fabric}
    >
      <div className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter fabric name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fabric_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fabric type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                  <SelectItem value="Poly Cotton">Poly Cotton</SelectItem>
                  <SelectItem value="Polyester">Polyester</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gsm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSM</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter GSM"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="meter">meter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter price"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color (Optional)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} 
                defaultValue={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Color</SelectItem>
                  {colors.map((color) => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        {color.name}
                      </div>
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
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
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

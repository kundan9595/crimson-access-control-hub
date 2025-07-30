
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  color_ids: z.array(z.string()).default([]),
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
  color_ids?: string[];
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
      name: '',
      fabric_type: 'Cotton',
      gsm: 100,
      uom: 'kg',
      price: 0,
      color_ids: [],
      image_url: '',
      status: 'active',
    },
  });

  // Reset form values when fabric changes or dialog opens
  useEffect(() => {
    if (open) {
      if (fabric) {
        // Editing existing fabric
        form.reset({
          name: fabric.name || '',
          fabric_type: fabric.fabric_type || 'Cotton',
          gsm: fabric.gsm || 100,
          uom: fabric.uom || 'kg',
          price: fabric.price || 0,
          color_ids: fabric.color_ids || [],
          image_url: fabric.image_url || '',
          status: fabric.status || 'active',
        });
      } else {
        // Creating new fabric
        form.reset({
          name: '',
          fabric_type: 'Cotton',
          gsm: 100,
          uom: 'kg',
          price: 0,
          color_ids: [],
          image_url: '',
          status: 'active',
        });
      }
    }
  }, [fabric, open, form]);

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
          ...(data.color_ids && data.color_ids.length > 0 && { color_ids: data.color_ids }),
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
              <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
          name="color_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colors (Optional)</FormLabel>
              <div className="space-y-3">
                <ScrollArea className="h-48 w-full border rounded-md p-4">
                  <div className="space-y-2">
                    {colors.map((color) => (
                      <div key={color.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={color.id}
                          checked={field.value?.includes(color.id) || false}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            if (checked) {
                              field.onChange([...currentValues, color.id]);
                            } else {
                              field.onChange(currentValues.filter(id => id !== color.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={color.id}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((colorId) => {
                      const color = colors.find(c => c.id === colorId);
                      return color ? (
                        <Badge key={colorId} variant="secondary" className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
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

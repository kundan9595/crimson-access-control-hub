
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateSku, useUpdateSku } from '@/hooks/masters/useSkus';
import { useClasses } from '@/hooks/masters/useClasses';
import { useSizes } from '@/hooks/masters/useSizes';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import { Sku } from '@/services/masters/types';

const skuSchema = z.object({
  sku_code: z.string().min(1, 'SKU code is required'),
  class_id: z.string().min(1, 'Class is required'),
  size_id: z.string().min(1, 'Size is required'),
  hsn_code: z.string().optional(),
  description: z.string().optional(),
  length_cm: z.string().optional(),
  breadth_cm: z.string().optional(),
  height_cm: z.string().optional(),
  weight_grams: z.string().optional(),
  base_mrp: z.string().optional(),
  cost_price: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type SkuFormData = z.infer<typeof skuSchema>;

interface SkuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku?: Sku;
}

export const SkuDialog = ({ open, onOpenChange, sku }: SkuDialogProps) => {
  const createMutation = useCreateSku();
  const updateMutation = useUpdateSku();
  const { data: classes = [] } = useClasses();
  const { data: sizes = [] } = useSizes();
  const { data: priceTypes = [] } = usePriceTypes();

  const form = useForm<SkuFormData>({
    resolver: zodResolver(skuSchema),
    defaultValues: {
      sku_code: '',
      class_id: '',
      size_id: '',
      hsn_code: '',
      description: '',
      length_cm: '',
      breadth_cm: '',
      height_cm: '',
      weight_grams: '',
      base_mrp: '',
      cost_price: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (sku) {
      form.reset({
        sku_code: sku.sku_code,
        class_id: sku.class_id,
        size_id: sku.size_id,
        hsn_code: sku.hsn_code || '',
        description: sku.description || '',
        length_cm: sku.length_cm?.toString() || '',
        breadth_cm: sku.breadth_cm?.toString() || '',
        height_cm: sku.height_cm?.toString() || '',
        weight_grams: sku.weight_grams?.toString() || '',
        base_mrp: sku.base_mrp?.toString() || '',
        cost_price: sku.cost_price?.toString() || '',
        status: sku.status as 'active' | 'inactive',
      });
    } else {
      form.reset();
    }
  }, [sku, form]);

  const onSubmit = async (data: SkuFormData) => {
    const skuData = {
      sku_code: data.sku_code,
      class_id: data.class_id,
      size_id: data.size_id,
      hsn_code: data.hsn_code || null,
      description: data.description || null,
      length_cm: data.length_cm ? parseFloat(data.length_cm) : null,
      breadth_cm: data.breadth_cm ? parseFloat(data.breadth_cm) : null,
      height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
      weight_grams: data.weight_grams ? parseFloat(data.weight_grams) : null,
      base_mrp: data.base_mrp ? parseFloat(data.base_mrp) : null,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      price_type_prices: {},
      status: data.status,
    };

    try {
      if (sku) {
        await updateMutation.mutateAsync({ id: sku.id, updates: skuData });
      } else {
        await createMutation.mutateAsync(skuData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving SKU:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sku ? 'Edit SKU' : 'Add New SKU'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name}
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
                name="size_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sizes.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name} ({size.code})
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
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter HSN code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base MRP</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breadth_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breadth (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (grams)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                          <SelectValue />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : sku
                  ? 'Update SKU'
                  : 'Create SKU'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

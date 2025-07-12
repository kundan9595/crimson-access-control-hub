
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProfitMargin, useUpdateProfitMargin } from '@/hooks/masters/useProfitMargins';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';

const profitMarginSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  min_range: z.number().min(0, 'Min range must be >= 0'),
  max_range: z.number().min(0, 'Max range must be >= 0'),
  margin_percentage: z.number().min(0, 'Margin percentage must be >= 0').max(100, 'Margin percentage must be <= 100'),
  branding_print: z.number().min(0, 'Branding print must be >= 0').max(100, 'Branding print must be <= 100'),
  branding_embroidery: z.number().min(0, 'Branding embroidery must be >= 0').max(100, 'Branding embroidery must be <= 100'),
  status: z.string().default('active'),
}).refine((data) => data.max_range >= data.min_range, {
  message: 'Max range must be greater than or equal to min range',
  path: ['max_range'],
});

type ProfitMarginFormData = z.infer<typeof profitMarginSchema>;

interface ProfitMarginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profitMargin?: ProfitMargin;
}

export const ProfitMarginDialog: React.FC<ProfitMarginDialogProps> = ({
  open,
  onOpenChange,
  profitMargin,
}) => {
  const createProfitMarginMutation = useCreateProfitMargin();
  const updateProfitMarginMutation = useUpdateProfitMargin();
  const isEditing = !!profitMargin;

  const form = useForm<ProfitMarginFormData>({
    resolver: zodResolver(profitMarginSchema),
    defaultValues: {
      name: '',
      min_range: 0,
      max_range: 0,
      margin_percentage: 0,
      branding_print: 0,
      branding_embroidery: 0,
      status: 'active',
    },
  });

  // Reset form when dialog opens or profit margin changes
  React.useEffect(() => {
    if (open) {
      if (profitMargin) {
        form.reset({
          name: profitMargin.name,
          min_range: profitMargin.min_range,
          max_range: profitMargin.max_range,
          margin_percentage: profitMargin.margin_percentage,
          branding_print: profitMargin.branding_print,
          branding_embroidery: profitMargin.branding_embroidery,
          status: profitMargin.status,
        });
      } else {
        form.reset({
          name: '',
          min_range: 0,
          max_range: 0,
          margin_percentage: 0,
          branding_print: 0,
          branding_embroidery: 0,
          status: 'active',
        });
      }
    }
  }, [open, profitMargin, form]);

  const onSubmit = async (data: ProfitMarginFormData) => {
    try {
      if (profitMargin) {
        await updateProfitMarginMutation.mutateAsync({ 
          id: profitMargin.id, 
          updates: data 
        });
      } else {
        const createData = {
          name: data.name,
          min_range: data.min_range,
          max_range: data.max_range,
          margin_percentage: data.margin_percentage,
          branding_print: data.branding_print,
          branding_embroidery: data.branding_embroidery,
          status: data.status,
        };
        await createProfitMarginMutation.mutateAsync(createData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profit margin:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditing ? 'Edit Profit Margin' : 'Create Profit Margin'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createProfitMarginMutation.isPending || updateProfitMarginMutation.isPending}
      isEditing={isEditing}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter profit margin name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="min_range"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Range</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
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
          name="max_range"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Range</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
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
          name="margin_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Margin Percentage (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
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
          name="branding_print"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branding Print (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
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
          name="branding_embroidery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branding Embroidery (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
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

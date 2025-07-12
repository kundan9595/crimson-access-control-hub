
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
  min_range: z.coerce.number().min(0, 'Min range must be >= 0'),
  max_range: z.coerce.number().min(0, 'Max range must be >= 0'),
  margin_percentage: z.coerce.number().min(0, 'Margin percentage must be >= 0').max(100, 'Margin percentage must be <= 100'),
  branding_print: z.coerce.number().min(0, 'Branding print must be >= 0').max(100, 'Branding print must be <= 100'),
  branding_embroidery: z.coerce.number().min(0, 'Branding embroidery must be >= 0').max(100, 'Branding embroidery must be <= 100'),
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

  const form = useForm<ProfitMarginFormData>({
    resolver: zodResolver(profitMarginSchema),
    defaultValues: {
      name: profitMargin?.name || '',
      min_range: profitMargin?.min_range || 0,
      max_range: profitMargin?.max_range || 0,
      margin_percentage: profitMargin?.margin_percentage || 0,
      branding_print: profitMargin?.branding_print || 0,
      branding_embroidery: profitMargin?.branding_embroidery || 0,
      status: profitMargin?.status || 'active',
    },
  });

  const onSubmit = async (data: ProfitMarginFormData) => {
    try {
      if (profitMargin) {
        await updateProfitMarginMutation.mutateAsync({ id: profitMargin.id, updates: data });
      } else {
        await createProfitMarginMutation.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset();
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
      title={profitMargin ? 'Edit Profit Margin' : 'Add Profit Margin'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createProfitMarginMutation.isPending || updateProfitMarginMutation.isPending}
      isEditing={!!profitMargin}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Profit margin name" {...field} />
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
                <Input type="number" placeholder="0" {...field} />
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
                <Input type="number" placeholder="0" {...field} />
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
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

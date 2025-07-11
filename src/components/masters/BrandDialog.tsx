
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBrand, useUpdateBrand } from '@/hooks/masters/useBrands';
import ImageUpload from '@/components/ui/ImageUpload';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { Brand } from '@/services/mastersService';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type BrandFormData = z.infer<typeof brandSchema>;

type BrandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
};

const BrandDialog: React.FC<BrandDialogProps> = ({ open, onOpenChange, brand }) => {
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const isEditing = !!brand;

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      logo_url: brand?.logo_url || '',
      status: brand?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (brand && open) {
      form.reset({
        name: brand.name,
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        status: brand.status,
      });
    } else if (!brand && open) {
      form.reset({
        name: '',
        description: '',
        logo_url: '',
        status: 'active',
      });
    }
  }, [brand, open, form]);

  const onSubmit = (data: BrandFormData) => {
    const brandData = {
      name: data.name,
      description: data.description || null,
      logo_url: data.logo_url || null,
      status: data.status,
    };

    if (isEditing && brand) {
      updateBrandMutation.mutate(
        { id: brand.id, updates: brandData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createBrandMutation.mutate(brandData, {
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
      title={isEditing ? 'Edit Brand' : 'Create Brand'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createBrandMutation.isPending || updateBrandMutation.isPending}
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter brand name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Enter brand description" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="logo_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand Logo</FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value || ''}
                onChange={field.onChange}
                onRemove={() => field.onChange('')}
                placeholder="Upload brand logo"
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
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
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
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </BaseFormDialog>
  );
};

export default BrandDialog;

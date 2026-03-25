import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreatePromotionalBanner, useUpdatePromotionalBanner } from '@/hooks/masters/usePromotionalBanners';
import ImageUpload from '@/components/ui/ImageUpload';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { PromotionalBanner } from '@/services/masters/types';
import {
  promotionalBannerSchema,
  type PromotionalBannerFormData,
} from '@/lib/validation/schemas';

type PromotionalBannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionalBanner?: PromotionalBanner | null;
};

const PromotionalBannerDialog: React.FC<PromotionalBannerDialogProps> = ({
  open,
  onOpenChange,
  promotionalBanner,
}) => {
  const createPromotionalBannerMutation = useCreatePromotionalBanner();
  const updatePromotionalBannerMutation = useUpdatePromotionalBanner();
  const isEditing = !!promotionalBanner;

  const form = useForm<PromotionalBannerFormData>({
    resolver: zodResolver(promotionalBannerSchema),
    defaultValues: {
      title: promotionalBanner?.title || '',
      link: promotionalBanner?.link || '',
      category_label: promotionalBanner?.category_label || '',
      upload_date: promotionalBanner?.upload_date || '',
      banner_image: promotionalBanner?.banner_image || '',
      status: promotionalBanner?.status || 'active',
      position: promotionalBanner?.position ?? 0,
    },
  });

  React.useEffect(() => {
    if (promotionalBanner && open) {
      form.reset({
        title: promotionalBanner.title,
        link: promotionalBanner.link || '',
        category_label: promotionalBanner.category_label || '',
        upload_date: promotionalBanner.upload_date || '',
        banner_image: promotionalBanner.banner_image || '',
        status: promotionalBanner.status,
        position: promotionalBanner.position ?? 0,
      });
    } else if (!promotionalBanner && open) {
      form.reset({
        title: '',
        link: '',
        category_label: '',
        upload_date: '',
        banner_image: '',
        status: 'active',
        position: 0,
      });
    }
  }, [promotionalBanner, open, form]);

  const onSubmit = (data: PromotionalBannerFormData) => {
    const bannerData = {
      title: data.title,
      link: data.link || undefined,
      category_label: data.category_label || undefined,
      upload_date: data.upload_date || undefined,
      banner_image: data.banner_image || undefined,
      status: data.status,
      position: data.position,
    };

    if (isEditing && promotionalBanner) {
      updatePromotionalBannerMutation.mutate(
        { id: promotionalBanner.id, updates: bannerData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        },
      );
    } else {
      createPromotionalBannerMutation.mutate(bannerData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit catalogue promotion' : 'Create catalogue promotion'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={
        createPromotionalBannerMutation.isPending || updatePromotionalBannerMutation.isPending
      }
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Promotion name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://..." type="url" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category_label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Catalogues" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="upload_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Upload date</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Optional" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="banner_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Thumbnail</FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value || ''}
                onChange={field.onChange}
                onRemove={() => field.onChange('')}
                placeholder="Upload thumbnail"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display order (local)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                placeholder="0"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
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
              <RadioGroup value={field.value} onValueChange={field.onChange}>
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

export default PromotionalBannerDialog;

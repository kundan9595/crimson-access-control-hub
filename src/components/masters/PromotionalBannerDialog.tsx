import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePromotionalBanner, useUpdatePromotionalBanner } from '@/hooks/masters/usePromotionalBanners';
import { useCategories } from '@/hooks/masters/useCategories';
import { useBrands } from '@/hooks/masters/useBrands';
import { useClasses } from '@/hooks/masters/useClasses';
import ImageUpload from '@/components/ui/ImageUpload';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { PromotionalBanner } from '@/services/masters/types';

const promotionalBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  banner_image: z.string().optional(),
  status: z.string(),
  position: z.number().min(0, 'Position must be 0 or greater'),
  category_id: z.string().optional(),
  brand_id: z.string().min(1, 'Brand is required'),
  class_id: z.string().optional(),
});

type PromotionalBannerFormData = z.infer<typeof promotionalBannerSchema>;

type PromotionalBannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionalBanner?: PromotionalBanner | null;
};

const PromotionalBannerDialog: React.FC<PromotionalBannerDialogProps> = ({ 
  open, 
  onOpenChange, 
  promotionalBanner 
}) => {
  const createPromotionalBannerMutation = useCreatePromotionalBanner();
  const updatePromotionalBannerMutation = useUpdatePromotionalBanner();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: classes = [] } = useClasses();
  const isEditing = !!promotionalBanner;

  // State for dependent dropdowns
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const form = useForm<PromotionalBannerFormData>({
    resolver: zodResolver(promotionalBannerSchema),
    defaultValues: {
      title: promotionalBanner?.title || '',
      banner_image: promotionalBanner?.banner_image || '',
      status: promotionalBanner?.status || 'active',
      position: promotionalBanner?.position || 0,
      category_id: promotionalBanner?.category_id || 'none',
      brand_id: promotionalBanner?.brand_id || '',
      class_id: promotionalBanner?.class_id || 'none',
    }
  });

  // For now, show all brands and classes since the relationships are not stored in the tables
  const filteredBrands = brands;
  const filteredClasses = classes;

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    form.setValue('category_id', categoryId === 'none' ? '' : categoryId);
    
    // Clear brand and class if category changes
    if (categoryId !== selectedCategoryId) {
      form.setValue('brand_id', '');
      form.setValue('class_id', '');
      setSelectedBrandId('');
    }
  };

  // Handle brand change
  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    form.setValue('brand_id', brandId);
    
    // Clear class if brand changes
    if (brandId !== selectedBrandId) {
      form.setValue('class_id', '');
    }
  };

  // Handle class change
  const handleClassChange = (classId: string) => {
    form.setValue('class_id', classId === 'none' ? '' : classId);
  };

  React.useEffect(() => {
    if (promotionalBanner && open) {
      form.reset({
        title: promotionalBanner.title,
        banner_image: promotionalBanner.banner_image || '',
        status: promotionalBanner.status,
        position: promotionalBanner.position,
        category_id: promotionalBanner.category_id || 'none',
        brand_id: promotionalBanner.brand_id,
        class_id: promotionalBanner.class_id || 'none',
      });
      setSelectedCategoryId(promotionalBanner.category_id || '');
      setSelectedBrandId(promotionalBanner.brand_id);
    } else if (!promotionalBanner && open) {
      form.reset({
        title: '',
        banner_image: '',
        status: 'active',
        position: 0,
        category_id: 'none',
        brand_id: '',
        class_id: 'none',
      });
      setSelectedCategoryId('');
      setSelectedBrandId('');
    }
  }, [promotionalBanner, open, form]);

  const onSubmit = (data: PromotionalBannerFormData) => {
    const bannerData = {
      title: data.title,
      banner_image: data.banner_image || null,
      status: data.status,
      position: data.position,
      category_id: data.category_id || null,
      brand_id: data.brand_id,
      class_id: data.class_id || null,
    };

    if (isEditing && promotionalBanner) {
      updatePromotionalBannerMutation.mutate(
        { id: promotionalBanner.id, updates: bannerData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createPromotionalBannerMutation.mutate(bannerData, {
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
      title={isEditing ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createPromotionalBannerMutation.isPending || updatePromotionalBannerMutation.isPending}
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter banner title" />
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
            <FormLabel>Banner Image</FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value || ''}
                onChange={field.onChange}
                onRemove={() => field.onChange('')}
                placeholder="Upload banner image"
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
            <FormLabel>Position</FormLabel>
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
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category (Optional)</FormLabel>
            <Select onValueChange={handleCategoryChange} value={field.value || 'none'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
        name="brand_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand *</FormLabel>
            <Select onValueChange={handleBrandChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-brands" disabled>
                    {selectedCategoryId ? 'No brands found for selected category' : 'Select a category first'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="class_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class (Optional)</FormLabel>
            <Select onValueChange={handleClassChange} value={field.value || 'none'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">No class</SelectItem>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-classes" disabled>
                    {selectedBrandId ? 'No classes found for selected brand' : 'Select a brand first'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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

export default PromotionalBannerDialog; 
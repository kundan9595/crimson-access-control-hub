
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useMasters';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { Category } from '@/services/mastersService';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sort_order: z.string().optional(),
  image_url: z.string().optional(),
  status: z.string(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
};

const CategoryDialog: React.FC<CategoryDialogProps> = ({ open, onOpenChange, category }) => {
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      sort_order: category?.sort_order?.toString() || '0',
      image_url: category?.image_url || '',
      status: category?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (category && open) {
      form.reset({
        name: category.name,
        description: category.description || '',
        sort_order: category.sort_order?.toString() || '0',
        image_url: category.image_url || '',
        status: category.status,
      });
    } else if (!category && open) {
      form.reset({
        name: '',
        description: '',
        sort_order: '0',
        image_url: '',
        status: 'active',
      });
    }
  }, [category, open, form]);

  const onSubmit = (data: CategoryFormData) => {
    const categoryData = {
      name: data.name,
      description: data.description || null,
      sort_order: data.sort_order ? parseInt(data.sort_order) : null,
      image_url: data.image_url || null,
      parent_id: null, // Always null since we removed parent category feature
      status: data.status,
    };

    if (isEditing && category) {
      updateCategoryMutation.mutate(
        { id: category.id, updates: categoryData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createCategoryMutation.mutate(categoryData, {
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
      title={isEditing ? 'Edit Category' : 'Create Category'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter category name" />
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
              <Textarea {...field} placeholder="Enter category description" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input {...field} type="number" placeholder="0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter image URL" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

export default CategoryDialog;


import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { useCreateCategory, useUpdateCategory, useCategories } from '@/hooks/useMasters';
import type { Category } from '@/services/mastersService';

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
};

type CategoryFormData = {
  name: string;
  description: string;
  parent_id: string | null;
  status: 'active' | 'inactive';
};

const CategoryDialog: React.FC<CategoryDialogProps> = ({ open, onOpenChange, category }) => {
  const { data: categories } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parent_id: category?.parent_id || null,
      status: category?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (category && open) {
      reset({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || null,
        status: category.status,
      });
    } else if (!category && open) {
      reset({
        name: '',
        description: '',
        parent_id: null,
        status: 'active',
      });
    }
  }, [category, open, reset]);

  const onSubmit = (data: CategoryFormData) => {
    const categoryData = {
      name: data.name,
      description: data.description || null,
      parent_id: data.parent_id || null,
      status: data.status,
    };

    if (isEditing) {
      updateCategoryMutation.mutate(
        { id: category.id, updates: categoryData },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          }
        }
      );
    } else {
      createCategoryMutation.mutate(categoryData, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        }
      });
    }
  };

  const statusValue = watch('status');
  const availableParentCategories = categories?.filter(cat => cat.id !== category?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter category name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={(value) => field.onChange(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {availableParentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;

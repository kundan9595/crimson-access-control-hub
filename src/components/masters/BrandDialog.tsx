
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { useCreateBrand, useUpdateBrand } from '@/hooks/useMasters';
import ImageUpload from '@/components/ui/ImageUpload';
import type { Brand } from '@/services/mastersService';

type BrandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
};

type BrandFormData = {
  name: string;
  description: string;
  logo_url: string;
  status: 'active' | 'inactive';
};

const BrandDialog: React.FC<BrandDialogProps> = ({ open, onOpenChange, brand }) => {
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const isEditing = !!brand;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BrandFormData>({
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      logo_url: brand?.logo_url || '',
      status: brand?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (brand && open) {
      reset({
        name: brand.name,
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        status: brand.status,
      });
    } else if (!brand && open) {
      reset({
        name: '',
        description: '',
        logo_url: '',
        status: 'active',
      });
    }
  }, [brand, open, reset]);

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
            reset();
          }
        }
      );
    } else {
      createBrandMutation.mutate(brandData, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        }
      });
    }
  };

  const statusValue = watch('status');
  const logoUrl = watch('logo_url');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Brand' : 'Create Brand'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter brand name"
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
              placeholder="Enter brand description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Brand Logo</Label>
            <ImageUpload
              value={logoUrl}
              onChange={(url) => setValue('logo_url', url)}
              onRemove={() => setValue('logo_url', '')}
              placeholder="Upload brand logo"
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
              disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrandDialog;


import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAppAsset, useUpdateAppAsset } from '@/hooks/masters/useAppAssets';
import ImageUpload from '@/components/ui/ImageUpload';
import { BaseFormDialog } from './shared/BaseFormDialog';
import type { AppAsset } from '@/services/masters/appAssetsService';

const appAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dx: z.number().min(0, 'dX must be 0 or greater'),
  dy: z.number().min(0, 'dY must be 0 or greater'),
  mirror_dx: z.number().min(0, 'Mirror dX must be 0 or greater'),
  asset_height_resp_to_box: z.number().min(0, 'Asset height must be 0 or greater'),
  asset: z.string().optional(),
  status: z.string(),
});

type AppAssetFormData = z.infer<typeof appAssetSchema>;

type AppAssetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appAsset?: AppAsset | null;
};

const AppAssetDialog: React.FC<AppAssetDialogProps> = ({ open, onOpenChange, appAsset }) => {
  const createAppAssetMutation = useCreateAppAsset();
  const updateAppAssetMutation = useUpdateAppAsset();
  const isEditing = !!appAsset;

  const form = useForm<AppAssetFormData>({
    resolver: zodResolver(appAssetSchema),
    defaultValues: {
      name: appAsset?.name || '',
      dx: appAsset?.dx || 0,
      dy: appAsset?.dy || 0,
      mirror_dx: appAsset?.mirror_dx || 0,
      asset_height_resp_to_box: appAsset?.asset_height_resp_to_box || 0,
      asset: appAsset?.asset || '',
      status: appAsset?.status || 'active',
    }
  });

  React.useEffect(() => {
    if (appAsset && open) {
      form.reset({
        name: appAsset.name,
        dx: appAsset.dx,
        dy: appAsset.dy,
        mirror_dx: appAsset.mirror_dx,
        asset_height_resp_to_box: appAsset.asset_height_resp_to_box,
        asset: appAsset.asset || '',
        status: appAsset.status,
      });
    } else if (!appAsset && open) {
      form.reset({
        name: '',
        dx: 0,
        dy: 0,
        mirror_dx: 0,
        asset_height_resp_to_box: 0,
        asset: '',
        status: 'active',
      });
    }
  }, [appAsset, open, form]);

  const onSubmit = (data: AppAssetFormData) => {
    const assetData = {
      name: data.name,
      dx: data.dx,
      dy: data.dy,
      mirror_dx: data.mirror_dx,
      asset_height_resp_to_box: data.asset_height_resp_to_box,
      asset: data.asset || null,
      status: data.status,
    };

    if (isEditing && appAsset) {
      updateAppAssetMutation.mutate(
        { id: appAsset.id, updates: assetData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createAppAssetMutation.mutate(assetData, {
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
      title={isEditing ? 'Edit App Asset' : 'Create App Asset'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createAppAssetMutation.isPending || updateAppAssetMutation.isPending}
      isEditing={isEditing}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter asset name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dx"
          render={({ field }) => (
            <FormItem>
              <FormLabel>dX</FormLabel>
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
          name="dy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>dY</FormLabel>
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
      </div>

      <FormField
        control={form.control}
        name="mirror_dx"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mirror dX</FormLabel>
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
        name="asset_height_resp_to_box"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Asset Height Resp to Box</FormLabel>
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
        name="asset"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Asset Image</FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value || ''}
                onChange={field.onChange}
                onRemove={() => field.onChange('')}
                placeholder="Upload asset image"
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

export default AppAssetDialog;

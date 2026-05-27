import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateBaseProductAssetInfo,
  useUpdateBaseProductAssetInfo,
  type BaseProductAssetInfo,
} from '@/hooks/masters/useBaseProductAssetInfos';
import { useAllBaseProducts } from '@/hooks/masters/useBaseProducts';
import { useAllAddOns } from '@/hooks/masters/useAddOns';
import { useAllParts } from '@/hooks/masters/useParts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllAppAssets } from '@/hooks/masters/useAppAssets';

const baseProductAssetInfoSchema = z.object({
  base_product_id: z.string().min(1, 'Base Product is required'),
  add_on_id: z.string().min(1, 'Add On is required'),
  part_id: z.string().min(1, 'Part is required'),
  asset_info_id: z.string().min(1, 'Asset Info is required'),
});

type BaseProductAssetInfoFormData = z.infer<typeof baseProductAssetInfoSchema>;

interface BaseProductAssetInfoDialogProps {
  assetInfo?: BaseProductAssetInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BaseProductAssetInfoDialog = ({
  assetInfo,
  open,
  onOpenChange,
}: BaseProductAssetInfoDialogProps) => {
  const createAssetInfo = useCreateBaseProductAssetInfo();
  const updateAssetInfo = useUpdateBaseProductAssetInfo();

  const { data: baseProducts = [], isLoading: isBaseProductsLoading } = useAllBaseProducts();
  const { data: addOns = [], isLoading: isAddOnsLoading } = useAllAddOns();
  const { data: parts = [], isLoading: isPartsLoading } = useAllParts();
  const { data: appAssets = [], isLoading: isAppAssetsLoading } = useAllAppAssets();

  const form = useForm<BaseProductAssetInfoFormData>({
    resolver: zodResolver(baseProductAssetInfoSchema),
    defaultValues: {
      base_product_id: assetInfo?.base_product_id || '',
      add_on_id: assetInfo?.add_on_id || '',
      part_id: assetInfo?.part_id || '',
      asset_info_id: assetInfo?.asset_info_id || '',
    },
  });

  React.useEffect(() => {
    if (assetInfo) {
      form.reset({
        base_product_id: assetInfo.base_product_id,
        add_on_id: assetInfo.add_on_id,
        part_id: assetInfo.part_id,
        asset_info_id: assetInfo.asset_info_id,
      });
    } else {
      form.reset({
        base_product_id: '',
        add_on_id: '',
        part_id: '',
        asset_info_id: '',
      });
    }
  }, [assetInfo, form, open]);

  const onSubmit = async (data: BaseProductAssetInfoFormData) => {
    try {
      const linkData = {
        base_product_id: data.base_product_id,
        add_on_id: data.add_on_id,
        part_id: data.part_id,
        asset_info_id: data.asset_info_id,
        is_deleted: false,
      };

      if (assetInfo) {
        await updateAssetInfo.mutateAsync({
          id: assetInfo.id,
          data: linkData,
        });
      } else {
        await createAssetInfo.mutateAsync(linkData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving base product asset link:', error);
    }
  };

  const isLoading =
    createAssetInfo.isPending ||
    updateAssetInfo.isPending ||
    isBaseProductsLoading ||
    isAddOnsLoading ||
    isPartsLoading ||
    isAppAssetsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {assetInfo ? 'Edit Base Product Asset Link' : 'Add New Base Product Asset Link'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="base_product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Product</FormLabel>
                  {isBaseProductsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a base product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {baseProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="add_on_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add On</FormLabel>
                  {isAddOnsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an add on" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {addOns.map((addOn) => (
                          <SelectItem key={addOn.id} value={addOn.id}>
                            {addOn.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="part_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part</FormLabel>
                  {isPartsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asset_info_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Info</FormLabel>
                  {isAppAssetsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset info" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {assetInfo ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BaseProductAssetInfoDialog;

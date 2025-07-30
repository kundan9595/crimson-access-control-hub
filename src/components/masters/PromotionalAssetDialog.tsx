import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageUpload from '@/components/ui/ImageUpload';
import { useCreatePromotionalAsset, useUpdatePromotionalAsset } from '@/hooks/masters/usePromotionalAssets';
import { PromotionalAsset } from '@/services/masters/types';

const promotionalAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  thumbnail: z.string().optional(),
  link: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  type: z.enum(['Video', 'Catalogue', 'Lifestyle Images', 'Images']),
  status: z.string(),
});

type PromotionalAssetFormData = z.infer<typeof promotionalAssetSchema>;

interface PromotionalAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionalAsset?: PromotionalAsset | null;
}

const PromotionalAssetDialog: React.FC<PromotionalAssetDialogProps> = ({
  open,
  onOpenChange,
  promotionalAsset,
}) => {
  const createMutation = useCreatePromotionalAsset();
  const updateMutation = useUpdatePromotionalAsset();

  const form = useForm<PromotionalAssetFormData>({
    resolver: zodResolver(promotionalAssetSchema),
    defaultValues: {
      name: '',
      thumbnail: '',
      link: '',
      type: 'Images',
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (promotionalAsset) {
      form.reset({
        name: promotionalAsset.name,
        thumbnail: promotionalAsset.thumbnail || '',
        link: promotionalAsset.link || '',
        type: promotionalAsset.type,
        status: promotionalAsset.status,
      });
    } else {
      form.reset({
        name: '',
        thumbnail: '',
        link: '',
        type: 'Images',
        status: 'active',
      });
    }
  }, [promotionalAsset, form]);

  const onSubmit = async (data: PromotionalAssetFormData) => {
    try {
      const formData = {
        name: data.name,
        thumbnail: data.thumbnail || null,
        link: data.link || null,
        type: data.type,
        status: data.status,
      };

      if (promotionalAsset) {
        await updateMutation.mutateAsync({ id: promotionalAsset.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving promotional asset:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {promotionalAsset ? 'Edit Promotional Asset' : 'Add Promotional Asset'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter asset name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Upload thumbnail image"
                    />
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
                  <FormLabel>Link (URL)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Catalogue">Catalogue</SelectItem>
                      <SelectItem value="Lifestyle Images">Lifestyle Images</SelectItem>
                      <SelectItem value="Images">Images</SelectItem>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : promotionalAsset ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalAssetDialog; 
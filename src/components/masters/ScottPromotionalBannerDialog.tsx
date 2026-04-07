import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateScottPromotionalBanner,
  useUpdateScottPromotionalBanner,
  type ScottPromotionalBanner,
} from '@/hooks/masters/useScottPromotionalBanners';
import { useCategories } from '@/hooks/masters/useCategories';
import { useClasses } from '@/hooks/masters/useClasses';
import { useAllBrands } from '@/hooks/masters/useBrands';
import ImageUpload from '@/components/ui/ImageUpload';
import { Skeleton } from '@/components/ui/skeleton';

const scottPromotionalBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.enum(['active', 'inactive']).default('active'),
  rmp_category_id: z.string().optional(),
  rmp_class_id: z.string().optional(),
  rmp_brand_id: z.string().optional(),
  position: z.coerce.number().int().min(0).default(0),
  image_url: z.string().optional(),
});

type ScottPromotionalBannerFormData = z.infer<typeof scottPromotionalBannerSchema>;

/** Radix Select reserves empty string for "clear"; items cannot use value="". */
const OPTIONAL_RELATION_NONE = '__rmp_none__';

interface ScottPromotionalBannerDialogProps {
  banner?: ScottPromotionalBanner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ScottPromotionalBannerDialog = ({
  banner,
  open,
  onOpenChange,
}: ScottPromotionalBannerDialogProps) => {
  const createBanner = useCreateScottPromotionalBanner();
  const updateBanner = useUpdateScottPromotionalBanner();

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: classes = [], isLoading: isClassesLoading } = useClasses();
  const { data: brands = [], isLoading: isBrandsLoading } = useAllBrands();

  const form = useForm<ScottPromotionalBannerFormData>({
    resolver: zodResolver(scottPromotionalBannerSchema),
    defaultValues: {
      title: banner?.title || '',
      status: (banner?.status as 'active' | 'inactive') || 'active',
      rmp_category_id: banner?.rmp_category_id || '',
      rmp_class_id: banner?.rmp_class_id || '',
      rmp_brand_id: banner?.rmp_brand_id || '',
      position: banner?.position || 0,
      image_url: banner?.image_url || '',
    },
  });

  React.useEffect(() => {
    if (banner) {
      form.reset({
        title: banner.title,
        status: banner.status as 'active' | 'inactive',
        rmp_category_id: banner.rmp_category_id || '',
        rmp_class_id: banner.rmp_class_id || '',
        rmp_brand_id: banner.rmp_brand_id || '',
        position: banner.position,
        image_url: banner.image_url || '',
      });
    } else {
      form.reset({
        title: '',
        status: 'active',
        rmp_category_id: '',
        rmp_class_id: '',
        rmp_brand_id: '',
        position: 0,
        image_url: '',
      });
    }
  }, [banner, form, open]);

  const onSubmit = async (data: ScottPromotionalBannerFormData) => {
    try {
      const bannerData = {
        title: data.title,
        status: data.status,
        position: data.position,
        rmp_category_id: data.rmp_category_id || undefined,
        rmp_class_id: data.rmp_class_id || undefined,
        rmp_brand_id: data.rmp_brand_id || undefined,
        image_url: data.image_url?.trim() || undefined,
      };

      if (banner) {
        await updateBanner.mutateAsync({
          id: banner.id,
          data: bannerData,
        });
      } else {
        await createBanner.mutateAsync({ data: bannerData });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving promotional banner:', error);
    }
  };

  const isLoading =
    createBanner.isPending || updateBanner.isPending || isCategoriesLoading || isClassesLoading || isBrandsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {banner ? 'Edit Promotional Banner (RMP)' : 'Add New Promotional Banner (RMP)'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {banner
              ? 'Update title, filters, status, position, and image for this banner.'
              : 'Create a banner with optional category, class, and brand filters.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter banner title" />
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
                    <Input {...field} type="number" min={0} placeholder="Display order" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rmp_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {isCategoriesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={field.value ? field.value : OPTIONAL_RELATION_NONE}
                      onValueChange={(v) =>
                        field.onChange(v === OPTIONAL_RELATION_NONE ? '' : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OPTIONAL_RELATION_NONE}>None</SelectItem>
                        {categories
                          .filter((c) => c.id !== '')
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
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
              name="rmp_class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  {isClassesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={field.value ? field.value : OPTIONAL_RELATION_NONE}
                      onValueChange={(v) =>
                        field.onChange(v === OPTIONAL_RELATION_NONE ? '' : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OPTIONAL_RELATION_NONE}>None</SelectItem>
                        {classes
                          .filter((c) => c.id !== '')
                          .map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
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
              name="rmp_brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  {isBrandsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={field.value ? field.value : OPTIONAL_RELATION_NONE}
                      onValueChange={(v) =>
                        field.onChange(v === OPTIONAL_RELATION_NONE ? '' : v)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OPTIONAL_RELATION_NONE}>None</SelectItem>
                        {brands
                          .filter((b) => b.id !== '')
                          .map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
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

            <FormField
              control={form.control}
              name="image_url"
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {banner ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScottPromotionalBannerDialog;

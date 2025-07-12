
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateStyle, useUpdateStyle, useBrands, useCategories } from '@/hooks/useMasters';
import { Style } from '@/services/mastersService';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  brand_id: z.string().optional(),
  category_id: z.string().optional(),
  status: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface StyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: Style;
}

export const StyleDialog: React.FC<StyleDialogProps> = ({
  open,
  onOpenChange,
  style,
}) => {
  const createMutation = useCreateStyle();
  const updateMutation = useUpdateStyle();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      brand_id: undefined,
      category_id: undefined,
      status: 'active',
    },
  });

  // Reset form when style prop changes
  useEffect(() => {
    if (style) {
      form.reset({
        name: style.name || '',
        description: style.description || '',
        brand_id: style.brand_id || undefined,
        category_id: style.category_id || undefined,
        status: style.status || 'active',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        brand_id: undefined,
        category_id: undefined,
        status: 'active',
      });
    }
  }, [style, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const styleData = {
        name: data.name,
        description: data.description || null,
        brand_id: data.brand_id || null,
        category_id: data.category_id || null,
        status: data.status,
        sort_order: style?.sort_order || null,
      };

      if (style) {
        await updateMutation.mutateAsync({ id: style.id, updates: styleData });
      } else {
        await createMutation.mutateAsync(styleData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving style:', error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{style ? 'Edit Style' : 'Add New Style'}</DialogTitle>
          <DialogDescription>
            {style ? 'Edit the style details below.' : 'Add a new style to your inventory.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter style name" {...field} />
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
                    <Textarea
                      placeholder="Enter style description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'no-brand' ? undefined : value)} 
                      value={field.value || 'no-brand'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-brand">No Brand</SelectItem>
                        {brands?.filter(brand => brand.status === 'active').map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
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
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'no-category' ? undefined : value)} 
                      value={field.value || 'no-category'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-category">No Category</SelectItem>
                        {categories?.filter(category => category.status === 'active').map((category) => (
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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : style ? 'Update Style' : 'Create Style'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

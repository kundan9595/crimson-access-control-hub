
import React from 'react';
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
import { useCreateStyle, useUpdateStyle } from '@/hooks/useMasters';
import { Style } from '@/services/mastersService';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  size_category: z.string().optional(),
  fabric_composition: z.string().optional(),
  care_instructions: z.string().optional(),
  season: z.string().optional(),
  gender: z.string().optional(),
  status: z.enum(['active', 'inactive']),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: style?.name || '',
      code: style?.code || '',
      description: style?.description || '',
      size_category: style?.size_category || '',
      fabric_composition: style?.fabric_composition || '',
      care_instructions: style?.care_instructions || '',
      season: style?.season || '',
      gender: style?.gender || '',
      status: style?.status || 'active',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Ensure all required fields are present and properly typed
      const styleData = {
        name: data.name,
        code: data.code,
        description: data.description || null,
        size_category: data.size_category || null,
        fabric_composition: data.fabric_composition || null,
        care_instructions: data.care_instructions || null,
        season: data.season || null,
        gender: data.gender || null,
        status: data.status,
        color_variants: style?.color_variants || [],
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{style ? 'Edit Style' : 'Add New Style'}</DialogTitle>
          <DialogDescription>
            {style ? 'Edit the style details below.' : 'Add a new style to your inventory.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter style code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                name="size_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., S, M, L, XL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="autumn">Autumn</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                        <SelectItem value="all_season">All Season</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                        <SelectItem value="kids">Kids</SelectItem>
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
            </div>

            <FormField
              control={form.control}
              name="fabric_composition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fabric Composition</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 100% Cotton, 50% Polyester 50% Cotton" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="care_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Care Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter care instructions"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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

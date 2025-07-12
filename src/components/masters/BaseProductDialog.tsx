
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/ui/ImageUpload';
import { useCategories } from '@/hooks/masters/useCategories';
import { useFabrics } from '@/hooks/masters/useFabrics';
import { useParts } from '@/hooks/masters/useParts';
import { useCreateBaseProduct, useUpdateBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.number().min(0).default(0),
  calculator: z.enum(['Knit', 'Woven']).optional(),
  category_id: z.string().optional(),
  fabric_id: z.string().optional(),
  parts: z.array(z.string()).default([]),
  base_price: z.number().min(0).default(0),
  base_sn: z.number().optional(),
  trims_cost: z.number().min(0).default(0),
  adult_consumption: z.number().min(0).default(0),
  kids_consumption: z.number().min(0).default(0),
  overhead_percentage: z.number().min(0).max(100).default(0),
  sample_rate: z.number().min(0).default(0),
  image_url: z.string().optional(),
  size_type: z.enum(['Adult', 'Kids', 'Both']).default('Adult'),
  branding_sides: z.array(z.any()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
});

type FormData = z.infer<typeof formSchema>;

interface BaseProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseProduct?: BaseProduct;
}

export const BaseProductDialog: React.FC<BaseProductDialogProps> = ({
  open,
  onOpenChange,
  baseProduct,
}) => {
  const { data: categories = [] } = useCategories();
  const { data: fabrics = [] } = useFabrics();
  const { data: parts = [] } = useParts();
  const createMutation = useCreateBaseProduct();
  const updateMutation = useUpdateBaseProduct();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sort_order: 0,
      calculator: undefined,
      category_id: '',
      fabric_id: '',
      parts: [],
      base_price: 0,
      base_sn: undefined,
      trims_cost: 0,
      adult_consumption: 0,
      kids_consumption: 0,
      overhead_percentage: 0,
      sample_rate: 0,
      image_url: '',
      size_type: 'Adult',
      branding_sides: [],
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (baseProduct) {
      form.reset({
        name: baseProduct.name,
        sort_order: baseProduct.sort_order,
        calculator: baseProduct.calculator,
        category_id: baseProduct.category_id || '',
        fabric_id: baseProduct.fabric_id || '',
        parts: baseProduct.parts || [],
        base_price: baseProduct.base_price,
        base_sn: baseProduct.base_sn,
        trims_cost: baseProduct.trims_cost,
        adult_consumption: baseProduct.adult_consumption,
        kids_consumption: baseProduct.kids_consumption,
        overhead_percentage: baseProduct.overhead_percentage,
        sample_rate: baseProduct.sample_rate,
        image_url: baseProduct.image_url || '',
        size_type: baseProduct.size_type,
        branding_sides: baseProduct.branding_sides || [],
        status: baseProduct.status as 'active' | 'inactive',
      });
    } else {
      form.reset({
        name: '',
        sort_order: 0,
        calculator: undefined,
        category_id: '',
        fabric_id: '',
        parts: [],
        base_price: 0,
        base_sn: undefined,
        trims_cost: 0,
        adult_consumption: 0,
        kids_consumption: 0,
        overhead_percentage: 0,
        sample_rate: 0,
        image_url: '',
        size_type: 'Adult',
        branding_sides: [],
        status: 'active',
      });
    }
  }, [baseProduct, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      const formattedData = {
        ...data,
        category_id: data.category_id || null,
        fabric_id: data.fabric_id || null,
      };

      if (baseProduct) {
        await updateMutation.mutateAsync({
          id: baseProduct.id,
          updates: formattedData,
        });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving base product:', error);
    }
  };

  const addPart = (partId: string) => {
    const currentParts = form.getValues('parts') || [];
    if (!currentParts.includes(partId)) {
      form.setValue('parts', [...currentParts, partId]);
    }
  };

  const removePart = (partId: string) => {
    const currentParts = form.getValues('parts') || [];
    form.setValue('parts', currentParts.filter(id => id !== partId));
  };

  const selectedParts = form.watch('parts') || [];

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={baseProduct ? 'Edit Base Product' : 'Add Base Product'}
      onSubmit={form.handleSubmit(handleSubmit)}
      isLoading={createMutation.isPending || updateMutation.isPending}
    >
      <Form {...form}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter base product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="calculator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculator Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculator type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Knit">Knit</SelectItem>
                      <SelectItem value="Woven">Woven</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Adult">Adult</SelectItem>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
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
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
              name="fabric_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fabric</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fabric" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fabrics.map((fabric) => (
                        <SelectItem key={fabric.id} value={fabric.id}>
                          {fabric.name} ({fabric.fabric_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormItem>
            <FormLabel>Parts</FormLabel>
            <div className="space-y-2">
              <Select onValueChange={addPart}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parts to add" />
                </SelectTrigger>
                <SelectContent>
                  {parts
                    .filter(part => !selectedParts.includes(part.id))
                    .map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        {part.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedParts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedParts.map((partId) => {
                    const part = parts.find(p => p.id === partId);
                    return (
                      <Badge key={partId} variant="secondary" className="flex items-center gap-1">
                        {part?.name || partId}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removePart(partId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </FormItem>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="base_sn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base SN</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter base SN" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trims_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trims Cost</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="adult_consumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adult Consumption</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kids_consumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kids Consumption</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="overhead_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overhead Percentage (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      max="100"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sample_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Rate</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    onRemove={() => field.onChange('')}
                    placeholder="Upload base product image"
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Enable or disable this base product
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === 'active'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </BaseFormDialog>
  );
};

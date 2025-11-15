import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUpload from '@/components/ui/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories } from '@/hooks/masters/useCategories';
import { useFabrics } from '@/hooks/masters/useFabrics';
import { useParts } from '@/hooks/masters/useParts';
import { useSizeGroups } from '@/hooks/masters/useSizes';
import { useCreateBaseProduct, useUpdateBaseProduct } from '@/hooks/masters/useBaseProducts';
import { BaseProduct } from '@/services/masters/baseProductsService';
import { Badge } from '@/components/ui/badge';
import { X, Search, Package, DollarSign, Settings, Image, Tag, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BRANDING_SIDE_OPTIONS = [
  'Front Side',
  'Back Side',
  'Left Sleeves',
  'Right Sleeves',
  'Inner Label'
] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.number().min(0).default(0),
  calculator: z.number().min(0).default(0),
  category_id: z.string().optional(),
  fabric_id: z.string().optional(),
  size_group_ids: z.array(z.string()).default([]),
  parts: z.array(z.string()).default([]),
  base_price: z.number().min(0).default(0),
  base_sn: z.number().min(0).optional(),
  trims_cost: z.number().min(0).default(0),
  adult_consumption: z.number().min(0).default(0),
  kids_consumption: z.number().min(0).default(0),
  overhead_percentage: z.number().min(0).max(100).default(0),
  sample_rate: z.number().min(0).default(0),
  image_url: z.string().optional(),
  base_icon_url: z.string().optional(),
  branding_sides: z.array(z.string()).default([]),
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
  const { data: sizeGroups = [] } = useSizeGroups();
  const createMutation = useCreateBaseProduct();
  const updateMutation = useUpdateBaseProduct();
  
  const [newCustomSide, setNewCustomSide] = useState('');
  const [editingSide, setEditingSide] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sort_order: 0,
      calculator: 0,
      category_id: '',
      fabric_id: '',
      size_group_ids: [],
      parts: [],
      base_price: 0,
      base_sn: undefined,
      trims_cost: 0,
      adult_consumption: 0,
      kids_consumption: 0,
      overhead_percentage: 0,
      sample_rate: 0,
      image_url: '',
      base_icon_url: '',
      branding_sides: [],
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (baseProduct) {
      form.reset({
        name: baseProduct.name,
        sort_order: baseProduct.sort_order,
        calculator: typeof baseProduct.calculator === 'number' ? baseProduct.calculator : 0,
        category_id: baseProduct.category_id || '',
        fabric_id: baseProduct.fabric_id || '',
        size_group_ids: baseProduct.size_group_ids || [],
        parts: baseProduct.parts || [],
        base_price: baseProduct.base_price,
        base_sn: baseProduct.base_sn,
        trims_cost: baseProduct.trims_cost,
        adult_consumption: baseProduct.adult_consumption,
        kids_consumption: baseProduct.kids_consumption,
        overhead_percentage: baseProduct.overhead_percentage,
        sample_rate: baseProduct.sample_rate,
        image_url: baseProduct.image_url || '',
        base_icon_url: baseProduct.base_icon_url || '',
        branding_sides: baseProduct.branding_sides || [],
        status: baseProduct.status as 'active' | 'inactive',
      });
    } else {
      form.reset({
        name: '',
        sort_order: 0,
        calculator: 0,
        category_id: '',
        fabric_id: '',
        size_group_ids: [],
        parts: [],
        base_price: 0,
        base_sn: undefined,
        trims_cost: 0,
        adult_consumption: 0,
        kids_consumption: 0,
        overhead_percentage: 0,
        sample_rate: 0,
        image_url: '',
        base_icon_url: '',
        branding_sides: [],
        status: 'active',
      });
    }
  }, [baseProduct, form]);

  const handleSubmit = async (data: FormData) => {
    try {
      const formattedData = {
        name: data.name,
        sort_order: data.sort_order,
        calculator: data.calculator,
        category_id: data.category_id || null,
        fabric_id: data.fabric_id || null,
        size_group_ids: data.size_group_ids || [],
        parts: data.parts || [],
        base_price: data.base_price,
        base_sn: data.base_sn,
        trims_cost: data.trims_cost,
        adult_consumption: data.adult_consumption,
        kids_consumption: data.kids_consumption,
        overhead_percentage: data.overhead_percentage,
        sample_rate: data.sample_rate,
        image_url: data.image_url,
        base_icon_url: data.base_icon_url,
        branding_sides: data.branding_sides,
        status: data.status,
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
  const selectedSizeGroups = form.watch('size_group_ids') || [];
  const [sizeGroupSearchTerm, setSizeGroupSearchTerm] = React.useState('');
  
  // Filter size groups based on search term
  const filteredSizeGroups = sizeGroups.filter(sizeGroup =>
    sizeGroup.name.toLowerCase().includes(sizeGroupSearchTerm.toLowerCase()) ||
    (sizeGroup.description && sizeGroup.description.toLowerCase().includes(sizeGroupSearchTerm.toLowerCase()))
  );

  const handleSizeGroupToggle = (sizeGroupId: string, checked: boolean) => {
    const currentSizeGroups = form.getValues('size_group_ids') || [];
    if (checked) {
      form.setValue('size_group_ids', [...currentSizeGroups, sizeGroupId]);
    } else {
      form.setValue('size_group_ids', currentSizeGroups.filter(id => id !== sizeGroupId));
    }
  };

  const removeSizeGroup = (sizeGroupId: string) => {
    const currentSizeGroups = form.getValues('size_group_ids') || [];
    form.setValue('size_group_ids', currentSizeGroups.filter(id => id !== sizeGroupId));
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={baseProduct ? 'Edit Base Product' : 'Add Base Product'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isEditing={!!baseProduct}
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Consumption
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      <FormLabel>Calculator</FormLabel>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories & Groups Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories & Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <FormLabel>Size Groups</FormLabel>
                <div className="space-y-4">
                  {/* Selected Size Groups */}
                  {selectedSizeGroups.length > 0 && (
                    <div className="space-y-2">
                      <FormLabel className="text-sm">Selected Size Groups</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {selectedSizeGroups.map((sizeGroupId) => {
                          const sizeGroup = sizeGroups.find(sg => sg.id === sizeGroupId);
                          return sizeGroup ? (
                            <Badge key={sizeGroupId} variant="secondary" className="flex items-center gap-1">
                              {sizeGroup.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removeSizeGroup(sizeGroupId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Size Groups */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm">Available Size Groups</FormLabel>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search size groups..."
                        value={sizeGroupSearchTerm}
                        onChange={(e) => setSizeGroupSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-4">
                      {filteredSizeGroups.map((sizeGroup) => (
                        <div key={sizeGroup.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={sizeGroup.id}
                            checked={selectedSizeGroups.includes(sizeGroup.id)}
                            onCheckedChange={(checked) => 
                              handleSizeGroupToggle(sizeGroup.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={sizeGroup.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {sizeGroup.name}
                          </label>
                        </div>
                      ))}
                      {filteredSizeGroups.length === 0 && (
                        <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                          No size groups found
                        </div>
                      )}
                    </div>
                    {filteredSizeGroups.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Showing {filteredSizeGroups.length} of {sizeGroups.length} size groups
                      </p>
                    )}
                  </div>
                </div>
              </FormItem>

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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing & Costs Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Costs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumption Tab */}
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Material Consumption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Branding Tab */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Media & Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_icon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Icon</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ''}
                          onChange={field.onChange}
                          onRemove={() => field.onChange('')}
                          placeholder="Upload base product icon"
                        />
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
              </div>

              <FormField
                control={form.control}
                name="branding_sides"
                render={() => {
                  const brandingSides = form.watch('branding_sides') || [];
                  const standardSides = brandingSides.filter(side => 
                    BRANDING_SIDE_OPTIONS.includes(side as any)
                  );
                  const customSides = brandingSides.filter(side => 
                    !BRANDING_SIDE_OPTIONS.includes(side as any)
                  );

                  const handleAddCustomSide = () => {
                    if (newCustomSide.trim() && !brandingSides.includes(newCustomSide.trim())) {
                      form.setValue('branding_sides', [...brandingSides, newCustomSide.trim()]);
                      setNewCustomSide('');
                    }
                  };

                  const handleEditCustomSide = (oldSide: string) => {
                    if (editingValue.trim() && editingValue.trim() !== oldSide) {
                      const updatedSides = brandingSides.map(side => 
                        side === oldSide ? editingValue.trim() : side
                      );
                      form.setValue('branding_sides', updatedSides);
                    }
                    setEditingSide(null);
                    setEditingValue('');
                  };

                  const handleRemoveCustomSide = (sideToRemove: string) => {
                    form.setValue('branding_sides', brandingSides.filter(side => side !== sideToRemove));
                  };

                  const startEditing = (side: string) => {
                    setEditingSide(side);
                    setEditingValue(side);
                  };

                  return (
                    <FormItem>
                      <FormLabel>Branding Sides</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {BRANDING_SIDE_OPTIONS.map((option) => (
                          <FormField
                            key={option}
                            control={form.control}
                            name="branding_sides"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {option}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>

                      {/* Custom Branding Sides Section */}
                      <div className="mt-4 space-y-3 pt-4 border-t">
                        <FormLabel className="text-sm font-medium">Custom Branding Sides</FormLabel>
                        
                        {/* Display Custom Sides */}
                        {customSides.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {customSides.map((side) => (
                              <div key={side} className="flex items-center gap-1">
                                {editingSide === side ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleEditCustomSide(side);
                                        } else if (e.key === 'Escape') {
                                          setEditingSide(null);
                                          setEditingValue('');
                                        }
                                      }}
                                      className="h-8 w-32"
                                      autoFocus
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditCustomSide(side)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingSide(null);
                                        setEditingValue('');
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                                    <span>{side}</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditing(side)}
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveCustomSide(side)}
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Custom Side */}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Enter custom branding side"
                            value={newCustomSide}
                            onChange={(e) => setNewCustomSide(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCustomSide();
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAddCustomSide}
                            disabled={!newCustomSide.trim() || brandingSides.includes(newCustomSide.trim())}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </BaseFormDialog>
  );
};

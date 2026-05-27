
import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from './shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ImageUpload from '@/components/ui/ImageUpload';
import { useCreateFabric, useUpdateFabric } from '@/hooks/masters/useFabrics';
import { useAllColors, useCreateColor } from '@/hooks/masters/useColors';
import { Plus } from 'lucide-react';
import { Fabric } from '@/services/masters/types';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';

const FABRIC_TYPES = ['Cotton', 'Poly Cotton', 'Polyester'] as const;
type FabricType = (typeof FABRIC_TYPES)[number];

// Normalize whatever the API sends to a known fabric type label
function normalizeFabricTypeForForm(raw: string | undefined): FabricType {
  const s = (raw ?? '').toLowerCase().replace(/_/g, ' ').trim();
  if (s === 'cotton') return 'Cotton';
  if (s === 'polyester') return 'Polyester';
  if (s === 'poly cotton' || s === 'polycotton') return 'Poly Cotton';
  // If already a valid value (title-case from service normalization), return it
  if ((FABRIC_TYPES as readonly string[]).includes(raw ?? '')) return raw as FabricType;
  return 'Cotton';
}

const fabricSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fabric_type: z.string().min(1, 'Fabric type is required'),
  gsm: z.number().min(1, 'GSM must be greater than 0'),
  uom: z.string().min(1, 'Unit of measure is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  color_ids: z.array(z.string()).default([]),
  image_url: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
});

type FabricFormData = z.infer<typeof fabricSchema>;

interface FabricDialogProps {
  fabric?: Fabric;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FabricDialog: React.FC<FabricDialogProps> = ({
  fabric,
  open,
  onOpenChange,
}) => {
  const createFabric = useCreateFabric();
  const updateFabric = useUpdateFabric();
  const { data: colors = [] } = useAllColors();
  const createColor = useCreateColor();

  const [addColorOpen, setAddColorOpen] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const form = useForm<FabricFormData>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      name: '',
      fabric_type: 'Cotton',
      gsm: 100,
      uom: 'kg',
      price: 0,
      color_ids: [],
      image_url: '',
      status: 'active',
    },
  });

  // Reset form values when fabric changes or dialog opens
  useEffect(() => {
    if (!open) return;
    if (fabric) {
      const previewUrl = fabric.image_url ? proxifyScottImageUrl(fabric.image_url) : '';
      form.reset({
        name: fabric.name || '',
        fabric_type: normalizeFabricTypeForForm(fabric.fabric_type),
        gsm: fabric.gsm || 100,
        uom: fabric.uom || '',
        price: fabric.price || 0,
        color_ids: fabric.color_ids || [],
        image_url: previewUrl,
        status: fabric.status || 'active',
      });
    } else {
      form.reset({
        name: '',
        fabric_type: 'Cotton',
        gsm: 100,
        uom: 'kg',
        price: 0,
        color_ids: [],
        image_url: '',
        status: 'active',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabric, open]);

  const onSubmit = async (data: FabricFormData) => {
    try {
      const payload = {
        name: data.name,
        fabric_type: data.fabric_type,
        gsm: data.gsm,
        uom: data.uom,
        price: data.price,
        status: data.status,
        color_ids: data.color_ids ?? [],
      };
      if (fabric) {
        await updateFabric.mutateAsync({ id: fabric.id, data: payload });
      } else {
        await createFabric.mutateAsync({ data: payload });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save fabric:', error);
    }
  };

  const isLoading = createFabric.isPending || updateFabric.isPending;

  const handleSelectAllColors = (checked: boolean, currentValue: string[]) => {
    if (checked) {
      const allColorIds = colors.map(color => color.id);
      form.setValue('color_ids', allColorIds);
    } else {
      form.setValue('color_ids', []);
    }
  };

  const handleQuickAddColor = () => {
    if (!newColorName.trim() || !/^#[0-9A-Fa-f]{6}$/.test(newColorHex)) return;
    createColor.mutate(
      { name: newColorName.trim(), hex_code: newColorHex, status: 'active' },
      {
        onSuccess: (created) => {
          const current = form.getValues('color_ids') || [];
          form.setValue('color_ids', [...current, created.id]);
          setAddColorOpen(false);
          setNewColorName('');
          setNewColorHex('#000000');
        },
      },
    );
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={fabric ? 'Edit Fabric' : 'Add Fabric'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={isLoading}
      isEditing={!!fabric}
    >
      <div className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter fabric name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fabric_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fabric type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                  <SelectItem value="Poly Cotton">Poly Cotton</SelectItem>
                  <SelectItem value="Polyester">Polyester</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gsm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSM</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter GSM"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="uom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. kg, meter, yard" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter price"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color_ids"
          render={({ field }) => {
            const selectedColors = field.value || [];
            const allColorsSelected = colors.length > 0 && selectedColors.length === colors.length;
            const someColorsSelected = selectedColors.length > 0 && selectedColors.length < colors.length;
            const selectAllRef = useRef<HTMLButtonElement>(null);
            
            useEffect(() => {
              if (selectAllRef.current) {
                (selectAllRef.current as any).indeterminate = someColorsSelected;
              }
            }, [someColorsSelected]);
            
            return (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Colors (Optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    setNewColorName('');
                    setNewColorHex('#000000');
                    setAddColorOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Add Color
                </Button>
              </div>
              <div className="space-y-3">
                <ScrollArea className="h-48 w-full border rounded-md p-4">
                  <div className="space-y-2">
                    {/* Select All Option */}
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-colors"
                        checked={allColorsSelected}
                        ref={selectAllRef as any}
                        onCheckedChange={(checked) => handleSelectAllColors(checked as boolean, selectedColors)}
                      />
                      <label
                        htmlFor="select-all-colors"
                        className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Select All
                      </label>
                    </div>
                    {colors.map((color) => (
                      <div key={color.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={color.id}
                          checked={selectedColors.includes(color.id)}
                          onCheckedChange={(checked) => {
                            const currentValues = field.value || [];
                            if (checked) {
                              field.onChange([...currentValues, color.id]);
                            } else {
                              field.onChange(currentValues.filter(id => id !== color.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={color.id}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {selectedColors && selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map((colorId) => {
                      const color = colors.find(c => c.id === colorId);
                      return color ? (
                        <Badge key={colorId} variant="secondary" className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Image</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nested quick-add color dialog */}
      <Dialog open={addColorOpen} onOpenChange={setAddColorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Midnight Blue"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddColor()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hex Code</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="#000000"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAddColor()}
                />
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(newColorHex) ? newColorHex : '#000000'}
                  onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded border cursor-pointer p-0.5 bg-transparent"
                  title="Pick a color"
                />
                <div
                  className="w-10 h-10 rounded border flex-shrink-0"
                  style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(newColorHex) ? newColorHex : 'transparent' }}
                />
              </div>
              {newColorHex && !/^#[0-9A-Fa-f]{6}$/.test(newColorHex) && (
                <p className="text-xs text-destructive">Enter a valid hex code (e.g. #FF0000)</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddColorOpen(false)}
              disabled={createColor.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuickAddColor}
              disabled={
                !newColorName.trim() ||
                !/^#[0-9A-Fa-f]{6}$/.test(newColorHex) ||
                createColor.isPending
              }
            >
              {createColor.isPending ? 'Adding…' : 'Add & Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseFormDialog>
  );
};

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSizeGroup, useUpdateSizeGroup, useCreateSize } from '@/hooks/useMasters';
import { SizeGroup } from '@/services/mastersService';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const sizeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.string(),
});

const sizeItemSchema = z.object({
  name: z.string().min(1, 'Size name is required'),
  code: z.string().min(1, 'Size code is required'),
});

type SizeGroupFormData = z.infer<typeof sizeGroupSchema>;
type SizeItem = z.infer<typeof sizeItemSchema> & { id: string };

interface SizeGroupWithSizesDialogProps {
  sizeGroup?: SizeGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SizeGroupWithSizesDialog = ({ sizeGroup, open, onOpenChange }: SizeGroupWithSizesDialogProps) => {
  const createSizeGroup = useCreateSizeGroup();
  const updateSizeGroup = useUpdateSizeGroup();
  const createSize = useCreateSize();
  
  const [sizes, setSizes] = useState<SizeItem[]>([]);

  const form = useForm<SizeGroupFormData>({
    resolver: zodResolver(sizeGroupSchema),
    defaultValues: {
      name: sizeGroup?.name || '',
      description: sizeGroup?.description || '',
      status: sizeGroup?.status || 'active',
    },
  });

  React.useEffect(() => {
    if (sizeGroup) {
      form.reset({
        name: sizeGroup.name,
        description: sizeGroup.description || '',
        status: sizeGroup.status,
      });
      setSizes([]);
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'active',
      });
      setSizes([]);
    }
  }, [sizeGroup, form]);

  const addSize = () => {
    setSizes(prev => [...prev, { id: `temp-${Date.now()}`, name: '', code: '' }]);
  };

  const removeSize = (id: string) => {
    setSizes(prev => prev.filter(size => size.id !== id));
  };

  const updateSizeItem = (id: string, field: keyof Omit<SizeItem, 'id'>, value: string) => {
    setSizes(prev => prev.map(size => 
      size.id === id ? { ...size, [field]: value } : size
    ));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sizes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSizes(items);
  };

  const onSubmit = async (data: SizeGroupFormData) => {
    try {
      const sizeGroupData = {
        name: data.name,
        description: data.description || null,
        status: data.status,
      };

      let sizeGroupId: string;

      if (sizeGroup) {
        await updateSizeGroup.mutateAsync({
          id: sizeGroup.id,
          updates: sizeGroupData,
        });
        sizeGroupId = sizeGroup.id;
      } else {
        const newSizeGroup = await createSizeGroup.mutateAsync(sizeGroupData);
        sizeGroupId = newSizeGroup.id;
      }

      // Create sizes if any were added
      if (sizes.length > 0 && !sizeGroup) {
        for (let i = 0; i < sizes.length; i++) {
          const size = sizes[i];
          if (size.name && size.code) {
            await createSize.mutateAsync({
              name: size.name,
              code: size.code,
              size_group_id: sizeGroupId,
              sort_order: i,
              status: 'active',
            });
          }
        }
      }

      onOpenChange(false);
      form.reset();
      setSizes([]);
    } catch (error) {
      console.error('Error saving size group:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sizeGroup ? 'Edit Size Group' : 'Add New Size Group'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter size group name" />
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
                      <Textarea {...field} placeholder="Enter description (optional)" />
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

            {!sizeGroup && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Sizes (Optional)</h3>
                  <Button type="button" onClick={addSize} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Size
                  </Button>
                </div>

                {sizes.length > 0 && (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="size-items">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {sizes.map((size, index) => (
                            <Draggable key={size.id} draggableId={size.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-3 p-3 border rounded-lg ${
                                    snapshot.isDragging ? 'shadow-lg bg-background' : ''
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div className="text-sm font-medium min-w-[2rem] text-center bg-muted px-2 py-1 rounded">
                                    {index + 1}
                                  </div>
                                  <Input
                                    placeholder="Size name (e.g., XS)"
                                    value={size.name}
                                    onChange={(e) => updateSizeItem(size.id, 'name', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Size code (e.g., xs)"
                                    value={size.code}
                                    onChange={(e) => updateSizeItem(size.id, 'code', e.target.value)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeSize(size.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSizeGroup.isPending || updateSizeGroup.isPending}
              >
                {sizeGroup ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SizeGroupWithSizesDialog;

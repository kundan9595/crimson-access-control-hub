
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowUpDown, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useSizes, useDeleteSize, useUpdateSize } from '@/hooks/useMasters';
import { Size } from '@/services/mastersService';
import SizeDialog from './SizeDialog';

interface SizeGroupSizesProps {
  sizeGroupId: string;
  sizeGroupName: string;
}

const SizeGroupSizes = ({ sizeGroupId, sizeGroupName }: SizeGroupSizesProps) => {
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: allSizes, isLoading } = useSizes();
  const deleteSize = useDeleteSize();
  const updateSize = useUpdateSize();

  // Filter sizes for this specific size group and sort by sort_order
  const groupSizes = allSizes?.filter(size => size.size_group_id === sizeGroupId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];

  const handleEdit = (size: Size) => {
    setEditingSize(size);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this size?')) {
      deleteSize.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSize(null);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(groupSizes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all affected items
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    // Update each size with new sort order
    for (const update of updates) {
      if (update.sort_order !== groupSizes.find(s => s.id === update.id)?.sort_order) {
        updateSize.mutate({
          id: update.id,
          updates: { sort_order: update.sort_order }
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading sizes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Sizes for {sizeGroupName}
          </CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Size
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {groupSizes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No sizes added yet for this size group.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Size
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sizes">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {groupSizes.map((size, index) => (
                    <Draggable key={size.id} draggableId={size.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            snapshot.isDragging ? 'shadow-lg bg-background' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-medium min-w-[2rem] text-center bg-muted px-2 py-1 rounded">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{size.name}</div>
                              <div className="text-sm text-muted-foreground">Code: {size.code}</div>
                            </div>
                            <Badge variant={size.status === 'active' ? 'default' : 'secondary'}>
                              {size.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(size)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(size.id)}
                              disabled={deleteSize.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

        <SizeDialog
          size={editingSize}
          sizeGroupId={sizeGroupId}
          open={isDialogOpen}
          onOpenChange={handleCloseDialog}
        />
      </CardContent>
    </Card>
  );
};

export default SizeGroupSizes;

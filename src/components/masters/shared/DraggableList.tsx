
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DraggableItem {
  id: string;
  sort_order?: number | null;
  [key: string]: any;
}

interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
  droppableId?: string;
}

function DraggableList<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  disabled = false,
  droppableId = 'draggable-list'
}: DraggableListProps<T>) {
  const [isDragDisabled, setIsDragDisabled] = useState(disabled);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update sort_order for all items
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      sort_order: index + 1
    }));

    onReorder(updatedItems);
  };

  if (disabled || isDragDisabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={item.id} className={itemClassName}>
            {renderItem(item, index, false)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              className,
              snapshot.isDraggingOver && "bg-muted/50"
            )}
          >
            {items.map((item, index) => (
              <Draggable 
                key={item.id} 
                draggableId={item.id} 
                index={index}
                isDragDisabled={isDragDisabled}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      itemClassName,
                      snapshot.isDragging && "opacity-80 shadow-lg rotate-1",
                      "transition-all duration-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        {...provided.dragHandleProps}
                        className="flex items-center justify-center p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        {renderItem(item, index, snapshot.isDragging)}
                      </div>
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
  );
}

export default DraggableList;

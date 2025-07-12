
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package } from 'lucide-react';
import { MasterEntityCard } from './shared/MasterEntityCard';
import { Part } from '@/services/masters/partsService';
import { useAddOns, useColors } from '@/hooks/masters';

interface PartsListProps {
  parts: Part[];
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}

export const PartsList: React.FC<PartsListProps> = ({
  parts,
  onEdit,
  onDelete,
}) => {
  console.log('📋 PartsList - Rendering with parts:', parts);
  
  const { data: addOns = [] } = useAddOns();
  const { data: colors = [] } = useColors();

  const getAddOnNames = (addOnIds: string[]) => {
    return addOnIds
      .map(id => addOns.find(addOn => addOn.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getColorNames = (colorIds: string[]) => {
    return colorIds
      .map(id => colors.find(color => color.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {parts.map((part) => (
        <MasterEntityCard
          key={part.id}
          title={part.name}
          description={part.description}
          status={part.status as 'active' | 'inactive'}
          icon={<Package className="h-5 w-5" />}
          onEdit={() => onEdit(part)}
          onDelete={() => onDelete(part)}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            {part.selected_add_ons.length > 0 && (
              <div>
                <span className="font-medium">Add-ons:</span>{' '}
                {getAddOnNames(part.selected_add_ons)}
              </div>
            )}
            {part.selected_colors.length > 0 && (
              <div>
                <span className="font-medium">Colors:</span>{' '}
                {getColorNames(part.selected_colors)}
              </div>
            )}
            <div className="flex items-center gap-2">
              {part.order_criteria && (
                <Badge variant="secondary" className="text-xs">
                  Order Criteria
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Position: {part.sort_position}
              </Badge>
            </div>
          </div>
        </MasterEntityCard>
      ))}
    </div>
  );
};

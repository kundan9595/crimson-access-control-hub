import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RelationshipCellProps {
  ids?: string[];
  lookupMap: Map<string, { id: string; name: string }>;
  maxDisplay?: number;
  emptyDisplay?: React.ReactNode;
  variant?: 'default' | 'badges' | 'comma';
}

export const RelationshipCell: React.FC<RelationshipCellProps> = ({
  ids,
  lookupMap,
  maxDisplay = 2,
  emptyDisplay = <span className="text-muted-foreground text-sm">-</span>,
  variant = 'default',
}) => {
  if (!ids?.length) return <>{emptyDisplay}</>;

  const resolved = ids
    .map((id) => lookupMap.get(id))
    .filter((item): item is { id: string; name: string } => Boolean(item));

  if (resolved.length === 0) return <>{emptyDisplay}</>;

  const displayItems = resolved.slice(0, maxDisplay);
  const remaining = resolved.length - maxDisplay;

  if (variant === 'badges') {
    return (
      <div className="flex flex-wrap gap-1">
        {displayItems.map((item) => (
          <Badge key={item.id} variant="outline" className="text-xs">
            {item.name}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remaining} more
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'comma') {
    return (
      <span className="text-sm text-muted-foreground">
        {displayItems.map((item) => item.name).join(', ')}
        {remaining > 0 && ` +${remaining} more`}
      </span>
    );
  }

  // Default variant - text with +N more
  return (
    <span className="text-sm text-muted-foreground">
      {displayItems.map((item) => item.name).join(', ')}
      {remaining > 0 && (
        <span className="text-muted-foreground/70"> +{remaining} more</span>
      )}
    </span>
  );
};

interface ColorRelationshipCellProps {
  ids?: string[];
  lookupMap: Map<string, { id: string; name: string; hex_code: string }>;
  maxDisplay?: number;
  emptyDisplay?: React.ReactNode;
}

export const ColorRelationshipCell: React.FC<ColorRelationshipCellProps> = ({
  ids,
  lookupMap,
  maxDisplay = 3,
  emptyDisplay = <span className="text-muted-foreground text-sm">-</span>,
}) => {
  if (!ids?.length) return <>{emptyDisplay}</>;

  const resolved = ids
    .map((id) => lookupMap.get(id))
    .filter((item): item is { id: string; name: string; hex_code: string } => Boolean(item));

  if (resolved.length === 0) return <>{emptyDisplay}</>;

  const displayItems = resolved.slice(0, maxDisplay);
  const remaining = resolved.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {displayItems.map((color) => (
        <div key={color.id} className="flex items-center gap-1" title={color.name}>
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: color.hex_code }}
          />
          <span className="text-xs text-muted-foreground">{color.name}</span>
        </div>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
      )}
    </div>
  );
};


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';

interface MasterEntityCardProps {
  title: string;
  description?: string | null;
  status: 'active' | 'inactive';
  children?: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const MasterEntityCard: React.FC<MasterEntityCardProps> = ({
  title,
  description,
  status,
  children,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Role = Tables<'roles'> & {
  role_permissions?: any[];
};

type RoleCardProps = {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
};

const RoleCard: React.FC<RoleCardProps> = ({ role, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{role.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(role)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(role.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription>{role.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <Badge variant="secondary">
              {role.role_permissions?.length || 0} permissions
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard; 
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Calendar, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { getRoleInitials, getRoleStatusBadge, formatDate, isRoleProtected } from '@/lib/roleUtils.tsx';
import { Badge } from '@/components/ui/badge';

type Role = {
  id: string;
  name: string;
  description?: string | null;
  is_warehouse_admin: boolean;
  created_at: string;
  updated_at: string;
};

type RoleCardProps = {
  role: Role;
  onEditRole: (role: Role) => void;
  onRoleAction: (action: string, roleId: string) => void;
};

const RoleCard: React.FC<RoleCardProps> = ({ role, onEditRole, onRoleAction }) => {
  const isProtected = isRoleProtected(role.name);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {getRoleInitials(role.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base flex items-center gap-2 truncate">
                <span className="truncate">{role.name}</span>
                {getRoleStatusBadge(role.is_warehouse_admin)}
              </CardTitle>
              {role.description && (
                <CardDescription className="text-xs mt-1 truncate">
                  {role.description}
                </CardDescription>
              )}
            </div>
          </div>
          {!isProtected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditRole(role)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Role
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onRoleAction('delete', role.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(role.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;


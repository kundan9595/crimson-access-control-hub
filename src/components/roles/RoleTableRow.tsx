import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
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

type RoleTableRowProps = {
  role: Role;
  onEditRole: (role: Role) => void;
  onRoleAction: (action: string, roleId: string) => void;
};

const RoleTableRow: React.FC<RoleTableRowProps> = ({ role, onEditRole, onRoleAction }) => {
  const isProtected = isRoleProtected(role.name);
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getRoleInitials(role.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{role.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {getRoleStatusBadge(role.is_warehouse_admin)}
      </TableCell>
      <TableCell>
        {role.description ? (
          <span className="text-sm text-muted-foreground">{role.description}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>{formatDate(role.created_at)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {!isProtected && (
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => onEditRole(role)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onRoleAction('delete', role.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RoleTableRow;


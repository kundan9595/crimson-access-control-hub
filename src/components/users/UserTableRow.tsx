import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Edit2, MoreVertical, UserCheck, UserX, Key, Trash2 } from 'lucide-react';
import { getUserInitials, getUserStatusBadge, getUserRoleBadges, formatDate } from '@/lib/userUtils.tsx';
import { Badge } from '@/components/ui/badge';

type User = any; // Replace with your Profile type

type UserTableRowProps = {
  user: User;
  onEditProfile: (user: User) => void;
  onManageRoles: (user: User) => void;
  onUserAction: (action: string, userId: string) => void;
};

const UserTableRow: React.FC<UserTableRowProps> = ({ user, onEditProfile, onManageRoles, onUserAction }) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback>
              {getUserInitials(user.first_name || '', user.last_name || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.first_name} {user.last_name}</p>
            {user.designation && (
              <p className="text-sm text-muted-foreground">{user.designation}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{getUserStatusBadge(user.is_active)}</TableCell>
      <TableCell>
        {user.department && (
          <Badge variant="outline">{user.department}</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {getUserRoleBadges(user.user_roles)}
        </div>
      </TableCell>
      <TableCell>{formatDate(user.created_at)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onEditProfile(user)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onManageRoles(user)}
          >
            Manage Roles
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUserAction('reset-password', user.id)}>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              {!user.is_active && (
                <DropdownMenuItem onClick={() => onUserAction('activate', user.id)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate
                </DropdownMenuItem>
              )}
              {user.is_active && (
                <DropdownMenuItem onClick={() => onUserAction('deactivate', user.id)}>
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onUserAction('delete', user.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow; 
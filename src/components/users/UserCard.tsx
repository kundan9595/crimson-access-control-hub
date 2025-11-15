import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Mail, Calendar, Edit2, MoreVertical, UserPlus, UserCheck, UserX, Key, Trash2 } from 'lucide-react';
import { getUserInitials, getUserStatusBadge, formatDate } from '@/lib/userUtils.tsx';
import { Badge } from '@/components/ui/badge';

type User = any; // Replace with your Profile type

type UserCardProps = {
  user: User;
  onEditProfile: (user: User) => void;
  onUserAction: (action: string, userId: string) => void;
};

const UserCard: React.FC<UserCardProps> = ({ user, onEditProfile, onUserAction }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="text-xs">
                {getUserInitials(user.first_name || '', user.last_name || '')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base flex items-center gap-2 truncate">
                <span className="truncate">{user.first_name} {user.last_name}</span>
                {getUserStatusBadge(user.is_active)}
              </CardTitle>
              <CardDescription className="text-xs mt-1 space-y-1">
                <div className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.department && (
                  <Badge variant="outline" className="text-xs">
                    {user.department}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditProfile(user)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUserAction('reset-password', user.id)}>
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              {!user.is_active && (
                <DropdownMenuItem onClick={() => onUserAction('activate', user.id)}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Activate User
                </DropdownMenuItem>
              )}
              {user.is_active && (
                <DropdownMenuItem onClick={() => onUserAction('deactivate', user.id)}>
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onUserAction('delete', user.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {user.designation && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Designation:</span>
              <span>{user.designation}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard; 
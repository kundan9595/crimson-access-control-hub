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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback>
                {getUserInitials(user.first_name || '', user.last_name || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-2">
                {user.first_name} {user.last_name}
                {getUserStatusBadge(user.is_active)}
              </CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(user.created_at)}
                  </span>
                  {user.department && (
                    <span className="text-sm bg-muted px-2 py-1 rounded">
                      {user.department}
                    </span>
                  )}
                  {user.designation && (
                    <span className="text-sm text-muted-foreground">
                      {user.designation}
                    </span>
                  )}
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onEditProfile(user)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-2">Department:</p>
            <div className="flex flex-wrap gap-2">
              {user.department ? (
                <Badge variant="outline">{user.department}</Badge>
              ) : (
                <span className="text-muted-foreground">No department assigned</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard; 
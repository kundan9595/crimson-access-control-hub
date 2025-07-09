
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Edit2, Shield, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserRoleForm from '@/components/users/UserRoleForm';
import CreateUserForm from '@/components/users/CreateUserForm';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Role = Tables<'roles'>;

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role_id,
            assigned_at,
            roles (
              id,
              name,
              description,
              is_warehouse_admin
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch available roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system and assign roles
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm 
              roles={roles || []}
              onSuccess={() => setIsCreateUserOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {usersLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="grid gap-6">
          {users?.map((user) => (
            <Card key={user.id}>
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
                        {user.user_roles?.some((ur: any) => ur.roles.is_warehouse_admin) && (
                          <Badge variant="default">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {formatDate(user.created_at)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedUser(user)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Manage Roles
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage User Roles</DialogTitle>
                        <DialogDescription>
                          Assign or remove roles for {user.first_name} {user.last_name}
                        </DialogDescription>
                      </DialogHeader>
                      <UserRoleForm 
                        user={user}
                        roles={roles || []}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['users'] });
                          setSelectedUser(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-2">Current Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.user_roles && user.user_roles.length > 0 ? (
                        user.user_roles.map((userRole: any) => (
                          <Badge key={userRole.role_id} variant="secondary">
                            {userRole.roles.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">No roles assigned</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;

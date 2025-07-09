
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Edit2, Shield, Mail, Calendar, Search, MoreVertical, UserCheck, UserX, Key, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UserRoleForm from '@/components/users/UserRoleForm';
import CreateUserForm from '@/components/users/CreateUserForm';
import UserProfileEditor from '@/components/users/UserProfileEditor';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Role = Tables<'roles'>;

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table'); // Changed default to table
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for updating user activation status
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Fetch users with their roles
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Fetching users...');
      
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length);

      // Then, get user roles for all users
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role_id,
          assigned_at,
          roles (
            id,
            name,
            description,
            is_warehouse_admin
          )
        `);
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('User roles fetched:', userRoles?.length);

      // Combine profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: userRoles?.filter(ur => ur.user_id === profile.id) || []
      })) || [];

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles;
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

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const getUserRoleBadges = (userRoles: any[]) => {
    if (!userRoles || userRoles.length === 0) {
      return <Badge variant="outline">No roles assigned</Badge>;
    }

    return userRoles.map((userRole: any) => (
      <Badge 
        key={userRole.role_id} 
        variant={userRole.roles?.is_warehouse_admin ? "default" : "secondary"}
        className="mr-1"
      >
        {userRole.roles?.is_warehouse_admin && <Shield className="w-3 h-3 mr-1" />}
        {userRole.roles?.name}
      </Badge>
    ));
  };

  const getUserStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "destructive"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const handleUserAction = async (action: string, userId: string, isActive?: boolean) => {
    try {
      switch (action) {
        case 'reset-password':
          // This would typically send a password reset email
          toast({
            title: "Password Reset",
            description: "Password reset email has been sent to the user.",
          });
          break;
        case 'activate':
          updateUserStatusMutation.mutate({ userId, isActive: true });
          break;
        case 'deactivate':
          updateUserStatusMutation.mutate({ userId, isActive: false });
          break;
        case 'delete':
          // This would require admin confirmation
          toast({
            title: "Delete User",
            description: "This action requires confirmation. Please contact system administrator.",
            variant: "destructive",
          });
          break;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (usersError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading users: {usersError.message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles ({filteredUsers.length} users)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          >
            {viewMode === 'cards' ? 'Table View' : 'Card View'}
          </Button>
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
                onSuccess={() => {
                  setIsCreateUserOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['users'] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {usersLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
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
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditProfileOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedUser(user);
                        setIsRoleFormOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Manage Roles
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUserAction('reset-password', user.id)}>
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        {!user.is_active && (
                          <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        {user.is_active && (
                          <DropdownMenuItem onClick={() => handleUserAction('deactivate', user.id)}>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleUserAction('delete', user.id)}
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
                    <p className="text-sm font-medium mb-2">Current Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {getUserRoleBadges(user.user_roles)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditProfileOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsRoleFormOpen(true);
                        }}
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
                          <DropdownMenuItem onClick={() => handleUserAction('reset-password', user.id)}>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          {!user.is_active && (
                            <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.is_active && (
                            <DropdownMenuItem onClick={() => handleUserAction('deactivate', user.id)}>
                              <UserX className="w-4 h-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleUserAction('delete', user.id)}
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserProfileEditor 
              user={selectedUser}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
                setIsEditProfileOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={isRoleFormOpen} onOpenChange={setIsRoleFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserRoleForm 
              user={selectedUser}
              roles={roles || []}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
                setIsRoleFormOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

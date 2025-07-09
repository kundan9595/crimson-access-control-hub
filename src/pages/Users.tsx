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
import { formatDate, getUserInitials, getUserRoleBadges, getUserStatusBadge } from '@/lib/userUtils.tsx';
import UserCard from '@/components/users/UserCard';
import UserTableRow from '@/components/users/UserTableRow';
import UserProfileEditDialog from '@/components/users/UserProfileEditDialog';
import UserRoleDialog from '@/components/users/UserRoleDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers, UserWithRoles } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';

type Profile = Tables<'profiles'>;
type Role = Tables<'roles'>;

const Users = () => {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles } = useRoles();

  // Mutation for updating user activation status
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log('=== Starting user status update ===');
      console.log('User ID:', userId);
      console.log('New active status:', isActive);
      console.log('Current user (auth.uid()):', (await supabase.auth.getUser()).data.user?.id);
      
      // First, let's check the current user's permissions
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('Current authenticated user:', currentUser.user?.id);
      
      // Check if current user has admin permissions
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('user_is_admin', { _user_id: currentUser.user?.id });
      
      console.log('Admin check result:', adminCheck);
      console.log('Admin check error:', adminError);
      
      // Try to fetch the user first to see current state
      const { data: beforeUpdate, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      console.log('User before update:', beforeUpdate);
      console.log('Fetch error:', fetchError);
      
      // Now attempt the update
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      console.log('Update result:', data);
      console.log('Update error:', error);
      
      // Check the user after update to verify the change
      const { data: afterUpdate, error: afterError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      console.log('User after update:', afterUpdate);
      console.log('After fetch error:', afterError);

      if (error) {
        console.error('=== Update failed ===');
        console.error('Error details:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('=== No rows were updated ===');
        throw new Error('No user was updated. This might be due to insufficient permissions.');
      }
      
      console.log('=== Update completed successfully ===');
      return data;
    },
    onSuccess: (data, { isActive }) => {
      console.log('Mutation succeeded, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      console.error('=== Mutation error ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Fetch users with their roles
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleUserAction = async (action: string, userId: string, isActive?: boolean) => {
    console.log('=== Handle user action called ===');
    console.log('Action:', action);
    console.log('User ID:', userId);
    console.log('Is Active:', isActive);
    
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
          console.log('Calling activate mutation...');
          updateUserStatusMutation.mutate({ userId, isActive: true });
          break;
        case 'deactivate':
          console.log('Calling deactivate mutation...');
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
      console.error('Error in handleUserAction:', error);
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
        viewMode === 'cards' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Roles</th>
                  <th className="px-4 py-2">Joined</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-2">
                        <Skeleton className="h-6 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : viewMode === 'cards' ? (
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEditProfile={() => {
                setSelectedUser(user);
                setIsEditProfileOpen(true);
              }}
              onManageRoles={() => {
                setSelectedUser(user);
                setIsRoleFormOpen(true);
              }}
              onUserAction={handleUserAction}
            />
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
                <UserTableRow
                  key={user.id}
                  user={user}
                  onEditProfile={() => {
                    setSelectedUser(user);
                    setIsEditProfileOpen(true);
                  }}
                  onManageRoles={() => {
                    setSelectedUser(user);
                    setIsRoleFormOpen(true);
                  }}
                  onUserAction={handleUserAction}
                />
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

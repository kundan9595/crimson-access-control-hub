import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Edit2, Mail, Calendar, Search, MoreVertical, UserCheck, UserX, Key, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateUserForm from '@/components/users/CreateUserForm';
import UserProfileEditor from '@/components/users/UserProfileEditor';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate, getUserInitials, getUserStatusBadge } from '@/lib/userUtils.tsx';
import { isRoleProtected } from '@/lib/roleUtils.tsx';
import UserTableRow from '@/components/users/UserTableRow';
import UserProfileEditDialog from '@/components/users/UserProfileEditDialog';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/useUsers';
import { deleteUser, resetUserPassword } from '@/services/usersService';
import { useRoles } from '@/hooks/useRoles';
import { deleteRole, Role } from '@/services/rolesService';
import RoleTableRow from '@/components/roles/RoleTableRow';
import CreateRoleForm from '@/components/roles/CreateRoleForm';
import EditRoleForm from '@/components/roles/EditRoleForm';

type Profile = Tables<'profiles'>;

const Users = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Mutation for resetting password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email?: string }) => {
      return resetUserPassword(userId, email);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset email has been sent to the user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating user activation status
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      // Starting user status update
      
      // Get current user for logging
      const { data: currentUser } = await supabase.auth.getUser();
      // Current authenticated user
      
      // Try to fetch the user first to see current state
      const { data: beforeUpdate, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      // User before update
      
      // Now attempt the update
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      // Update result
      
      // Check the user after update to verify the change
      const { data: afterUpdate, error: afterError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      // User after update

      if (error) {
        console.error('=== Update failed ===');
        console.error('Error details:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('=== No rows were updated ===');
        throw new Error('No user was updated. Please try again.');
      }
      
      // Update completed successfully
      return data;
    },
    onSuccess: (data, { isActive }) => {
      // Mutation succeeded, invalidating queries
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

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();

  // Fetch roles
  const { data: roles, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles();
  
  // Force refetch when switching to roles tab
  React.useEffect(() => {
    if (activeTab === 'roles' && !rolesLoading && (!roles || roles.length === 0)) {
      console.log('🔄 [Users] Forcing roles refetch because tab is active and no data');
      refetchRoles();
    }
  }, [activeTab, roles, rolesLoading, refetchRoles]);
  
  // Debug logging for roles
  React.useEffect(() => {
    console.log('🔍 Roles Debug Info:');
    console.log('  - Active Tab:', activeTab);
    console.log('  - Roles Data:', roles);
    console.log('  - Roles Loading:', rolesLoading);
    console.log('  - Roles Error:', rolesError);
    console.log('  - Roles Count:', roles?.length || 0);
    console.log('  - Search Term:', searchTerm);
  }, [roles, rolesLoading, rolesError, activeTab, searchTerm]);

  // Mutation for deleting role
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      console.log('🔄 [Users] Delete role mutation called for:', roleId);
      return deleteRole(roleId);
    },
    onSuccess: () => {
      console.log('✅ [Users] Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      console.error('❌ [Users] Error deleting role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter roles based on search term
  const filteredRoles = React.useMemo(() => {
    const filtered = (roles || []).filter(role => 
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('🔍 Filtered Roles:', {
      totalRoles: roles?.length || 0,
      searchTerm,
      filteredCount: filtered.length,
      filteredRoles: filtered
    });
    return filtered;
  }, [roles, searchTerm]);

  const handleUserAction = async (action: string, userId: string, isActive?: boolean) => {
    try {
      switch (action) {
        case 'reset-password':
          const user = users?.find(u => u.id === userId);
          resetPasswordMutation.mutate({ userId, email: user?.email });
          break;
        case 'activate':
          updateUserStatusMutation.mutate({ userId, isActive: true });
          break;
        case 'deactivate':
          updateUserStatusMutation.mutate({ userId, isActive: false });
          break;
        case 'delete':
          const userToDelete = users?.find(u => u.id === userId);
          if (userToDelete) {
            setUserToDelete(userToDelete);
          }
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

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleRoleAction = async (action: string, roleId: string) => {
    try {
      switch (action) {
        case 'delete':
          const roleToDelete = roles?.find(r => r.id === roleId);
          if (roleToDelete) {
            // Check if role is protected
            const protectedRoles = ['Super Admin', 'Warehouse Admin', 'User'];
            if (protectedRoles.includes(roleToDelete.name)) {
              toast({
                title: "Cannot Delete Role",
                description: `${roleToDelete.name} is a protected role and cannot be deleted.`,
                variant: "destructive",
              });
              return;
            }
            setRoleToDelete(roleToDelete);
          }
          break;
      }
    } catch (error) {
      console.error('Error in handleRoleAction:', error);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoleConfirm = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  if (usersError && activeTab === 'users') {
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

  // Don't return early on error - show error in the tab content instead

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
          <p className="text-muted-foreground">
            Manage system users and roles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === 'users' && (
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
                    Add a new user to the system
                  </DialogDescription>
                </DialogHeader>
                <CreateUserForm 
                  onSuccess={() => {
                    setIsCreateUserOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                  }}
                />
            </DialogContent>
          </Dialog>
          )}
          {activeTab === 'roles' && (
            <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Add a new role to the system
                  </DialogDescription>
                </DialogHeader>
                <CreateRoleForm 
                  onSuccess={() => {
                    setIsCreateRoleOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['roles'] });
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('🔄 [Tabs] Tab changed:', { from: activeTab, to: value });
        setActiveTab(value as 'users' | 'roles');
      }}>
        <TabsList>
          <TabsTrigger value="users">
            Users {users && `(${users.length})`}
          </TabsTrigger>
          <TabsTrigger value="roles">
            Roles {roles && `(${roles.length})`}
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-2 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={activeTab === 'users' ? "Search users..." : "Search roles..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="users" className="space-y-4">
          {usersLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Department</th>
                    <th className="px-4 py-2">Joined</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-2">
                          <Skeleton className="h-6 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      onUserAction={handleUserAction}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {(() => {
            console.log('🎨 [Roles Tab] Rendering roles tab content:', {
              rolesLoading,
              rolesError: rolesError?.message,
              rolesCount: roles?.length,
              filteredCount: filteredRoles.length,
              hasRoles: !!roles,
              rolesData: roles
            });
            return null;
          })()}
          {rolesError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-red-600 mb-4">Error loading roles: {rolesError.message}</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['roles'] })}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : rolesLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-2">
                          <Skeleton className="h-6 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : filteredRoles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No roles found matching your search.' : 'No roles found.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <RoleTableRow
                      key={role.id}
                      role={role}
                      onEditRole={() => {
                        if (isRoleProtected(role.name)) {
                          toast({
                            title: "Cannot Edit Role",
                            description: `${role.name} is a protected role and cannot be edited.`,
                            variant: "destructive",
                          });
                          return;
                        }
                        setSelectedRole(role);
                        setIsEditRoleOpen(true);
                      }}
                      onRoleAction={handleRoleAction}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name} ({userToDelete?.email})? 
              This action cannot be undone and will permanently remove the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information for {selectedRole?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <EditRoleForm 
              role={selectedRole}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['roles'] });
                setIsEditRoleOpen(false);
                setSelectedRole(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {roleToDelete?.name}? 
              This action cannot be undone and will permanently remove the role and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Users;

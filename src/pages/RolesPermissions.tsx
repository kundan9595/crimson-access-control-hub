
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import RoleForm from '@/components/roles/RoleForm';
import PermissionsList from '@/components/roles/PermissionsList';
import type { Tables } from '@/integrations/supabase/types';
import RoleList from '@/components/roles/RoleList';
import RoleDialog from '@/components/roles/RoleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoles } from '@/hooks/useRoles';
import { usePermissions } from '@/hooks/usePermissions';

type Role = Tables<'roles'>;
type Permission = Tables<'permissions'>;

const RolesPermissions = () => {
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage system roles and permissions
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Roles</h2>
            <Button onClick={() => setIsCreateRoleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
            <RoleDialog
              open={isCreateRoleOpen}
              onOpenChange={setIsCreateRoleOpen}
              permissions={permissions || []}
              onSuccess={() => setIsCreateRoleOpen(false)}
            />
          </div>

          {rolesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <RoleList
              roles={roles || []}
              onEdit={setEditingRole}
              onDelete={handleDeleteRole}
            />
          )}

          {/* Edit Role Dialog */}
          <RoleDialog
            open={!!editingRole}
            onOpenChange={() => setEditingRole(null)}
            role={editingRole}
            permissions={permissions || []}
            onSuccess={() => setEditingRole(null)}
          />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">System Permissions</h2>
            {permissionsLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-1/2 rounded" />
                ))}
              </div>
            ) : (
              <PermissionsList permissions={permissions || []} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissions;

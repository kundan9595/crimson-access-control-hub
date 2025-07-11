
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PermissionSelector from './PermissionSelector';
import type { Tables } from '@/integrations/supabase/types';

type Role = Tables<'roles'>;
type Permission = Tables<'permissions'>;

interface RoleFormProps {
  role?: Role;
  onSuccess: () => void;
  permissions: Permission[];
}

const RoleForm: React.FC<RoleFormProps> = ({ role, onSuccess, permissions }) => {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing permissions for the role
  useEffect(() => {
    if (role) {
      const fetchRolePermissions = async () => {
        const { data } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', role.id);
        
        if (data) {
          setSelectedPermissions(data.map(rp => rp.permission_id));
        }
      };
      fetchRolePermissions();
    }
  }, [role]);

  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: newRole, error } = await supabase
        .from('roles')
        .insert([{ ...data, is_warehouse_admin: false }])
        .select()
        .single();
      
      if (error) throw error;
      return newRole;
    },
    onSuccess: async (newRole) => {
      // Add permissions to the new role
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: newRole.id,
          permission_id: permissionId,
        }));

        await supabase
          .from('role_permissions')
          .insert(rolePermissions);
      }
      
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Success",
        description: "Role created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('roles')
        .update(data)
        .eq('id', role!.id);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      // Update role permissions
      if (role) {
        // Delete existing permissions
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id);

        // Add new permissions
        if (selectedPermissions.length > 0) {
          const rolePermissions = selectedPermissions.map(permissionId => ({
            role_id: role.id,
            permission_id: permissionId,
          }));

          await supabase
            .from('role_permissions')
            .insert(rolePermissions);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role) {
      updateRoleMutation.mutate(formData);
    } else {
      createRoleMutation.mutate(formData);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <PermissionSelector
        permissions={permissions}
        selectedPermissions={selectedPermissions}
        onPermissionChange={handlePermissionChange}
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
        >
          {role ? 'Update' : 'Create'} Role
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;

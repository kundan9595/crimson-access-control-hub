
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Role = Tables<'roles'>;

interface UserRoleFormProps {
  user: Profile & { user_roles?: any[] };
  roles: Role[];
  onSuccess: () => void;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({ user, roles, onSuccess }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize selected roles
  useEffect(() => {
    if (user.user_roles) {
      setSelectedRoles(user.user_roles.map((ur: any) => ur.role_id));
    }
  }, [user]);

  const updateUserRolesMutation = useMutation({
    mutationFn: async (roleIds: string[]) => {
      // First, remove all existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;

      // Then, add the new roles
      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => ({
          user_id: user.id,
          role_id: roleId,
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(userRoles);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User roles updated successfully",
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

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserRolesMutation.mutate(selectedRoles);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Label className="text-base font-medium">Select Roles</Label>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={role.id}
                checked={selectedRoles.includes(role.id)}
                onCheckedChange={(checked) => 
                  handleRoleChange(role.id, checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label htmlFor={role.id} className="font-medium">
                  {role.name}
                  {role.is_warehouse_admin && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Admin
                    </span>
                  )}
                </Label>
                {role.description && (
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={updateUserRolesMutation.isPending}
        >
          Update Roles
        </Button>
      </div>
    </form>
  );
};

export default UserRoleForm;

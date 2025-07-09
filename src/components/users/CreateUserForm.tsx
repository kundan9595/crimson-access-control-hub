import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Role = Tables<'roles'>;

interface CreateUserFormProps {
  roles: Role[];
  onSuccess: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ roles, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    designation: '',
    warehouseAssignment: '',
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData & { selectedRoles: string[] }) => {
      setIsLoading(true);
      
      // Generate a UUID for the new profile
      const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create user');

      // Create profile entry with the user's ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
        })
        .select()
        .single();
      
      if (profileError) throw profileError;
      
      // Assign roles to the user
      if (userData.selectedRoles.length > 0) {
        const userRoles = userData.selectedRoles.map(roleId => ({
          user_id: user.id,
          role_id: roleId,
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(userRoles);
        
        if (rolesError) throw rolesError;
      }
      
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User created successfully. They will receive an email to set up their account.",
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
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedRoles.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({ ...formData, selectedRoles });
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="warehouseAssignment">Warehouse Assignment</Label>
        <Input
          id="warehouseAssignment"
          value={formData.warehouseAssignment}
          onChange={(e) => setFormData(prev => ({ ...prev, warehouseAssignment: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Assign Roles *</Label>
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
        <Button type="submit" disabled={isLoading}>
          Create User
        </Button>
      </div>
    </form>
  );
};

export default CreateUserForm;

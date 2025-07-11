
import React from 'react';
import { useCreateUserForm } from '@/hooks/useCreateUserForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { departmentOptions } from '@/lib/userConstants';

type Role = Tables<'roles'>;
type DepartmentType = 'operations' | 'logistics' | 'warehouse' | 'customer_service' | 'administration' | 'finance' | 'it' | 'human_resources';

interface CreateUserFormProps {
  roles: Role[];
  onSuccess: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ roles, onSuccess }) => {
  const { formData, setFormData, selectedRoles, setSelectedRoles, createUser, isLoading } = useCreateUserForm(onSuccess);
  const { toast } = useToast();

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

    console.log('Submitting form with roles:', selectedRoles);
    createUser({ ...formData, selectedRoles });
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    console.log('Role change:', roleId, checked);
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
          <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="space-y-4">
        <Label className="text-base font-medium">Assign Roles *</Label>
        <div className="space-y-3 max-h-60 overflow-y-auto">
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
                <Label htmlFor={role.id} className="font-medium cursor-pointer">
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
        {selectedRoles.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Selected {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating User...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export default CreateUserForm;

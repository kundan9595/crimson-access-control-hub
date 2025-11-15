
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
import { useRoles } from '@/hooks/useRoles';

type DepartmentType = 'operations' | 'logistics' | 'warehouse' | 'customer_service' | 'administration' | 'finance' | 'it' | 'human_resources';

interface CreateUserFormProps {
  onSuccess: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onSuccess }) => {
  const { formData, setFormData, createUser, isLoading } = useCreateUserForm(onSuccess);
  const { toast } = useToast();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Submitting form
    createUser(formData);
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

      <div className="space-y-3">
        <Label>Roles</Label>
        <div className="space-y-2 border rounded-md p-4 max-h-48 overflow-y-auto">
          {rolesLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available</p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={formData.selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData(prev => ({
                        ...prev,
                        selectedRoles: [...prev.selectedRoles, role.id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        selectedRoles: prev.selectedRoles.filter(id => id !== role.id)
                      }));
                    }
                  }}
                />
                <Label
                  htmlFor={`role-${role.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {role.name}
                  {role.description && (
                    <span className="text-muted-foreground ml-2">- {role.description}</span>
                  )}
                </Label>
              </div>
            ))
          )}
        </div>
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

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RoleForm from './RoleForm';
import type { Tables } from '@/integrations/supabase/types';

type Role = Tables<'roles'>;
type Permission = Tables<'permissions'>;

type RoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
  permissions: Permission[];
  onSuccess: () => void;
};

const RoleDialog: React.FC<RoleDialogProps> = ({ open, onOpenChange, role, permissions, onSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role ? 'Modify role details and permissions' : 'Define a new role with specific permissions'}
          </DialogDescription>
        </DialogHeader>
        <RoleForm 
          role={role || undefined}
          onSuccess={onSuccess}
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog; 
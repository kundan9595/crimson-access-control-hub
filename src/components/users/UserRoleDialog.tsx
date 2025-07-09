import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import UserRoleForm from './UserRoleForm';

type User = any; // Replace with your Profile type

type Role = any; // Replace with your Role type

type UserRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roles: Role[];
  onSuccess: () => void;
};

const UserRoleDialog: React.FC<UserRoleDialogProps> = ({ open, onOpenChange, user, roles, onSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            Assign or remove roles for {user?.first_name} {user?.last_name}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <UserRoleForm 
            user={user}
            roles={roles}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserRoleDialog; 
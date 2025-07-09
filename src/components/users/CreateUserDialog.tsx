import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CreateUserForm from './CreateUserForm';

type Role = any; // Replace with your Role type

type CreateUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onSuccess: () => void;
};

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange, roles, onSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system and assign roles
          </DialogDescription>
        </DialogHeader>
        <CreateUserForm 
          roles={roles}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog; 
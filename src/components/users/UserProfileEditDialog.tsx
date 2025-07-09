import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import UserProfileEditor from './UserProfileEditor';

type User = any; // Replace with your Profile type

type UserProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
};

const UserProfileEditDialog: React.FC<UserProfileEditDialogProps> = ({ open, onOpenChange, user, onSuccess }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user information for {user?.first_name} {user?.last_name}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <UserProfileEditor 
            user={user}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileEditDialog; 
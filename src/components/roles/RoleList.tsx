import React from 'react';
import RoleCard from './RoleCard';
import type { Tables } from '@/integrations/supabase/types';

type Role = Tables<'roles'> & {
  role_permissions?: any[];
};

type RoleListProps = {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
};

const RoleList: React.FC<RoleListProps> = ({ roles, onEdit, onDelete }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default RoleList; 
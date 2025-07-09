
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tables } from '@/integrations/supabase/types';

type Permission = Tables<'permissions'>;

interface PermissionSelectorProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionId: string, checked: boolean) => void;
}

const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  permissions,
  selectedPermissions,
  onPermissionChange,
}) => {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const parts = permission.name.split('_');
    const action = parts[0]; // view, edit, delete, manage
    const category = parts[1] || 'general'; // users, roles, clients, etc.
    
    if (!acc[category]) {
      acc[category] = {};
    }
    if (!acc[category][action]) {
      acc[category][action] = [];
    }
    acc[category][action].push(permission);
    return acc;
  }, {} as Record<string, Record<string, Permission[]>>);

  const handleSmartSelection = (category: string, action: string, checked: boolean) => {
    const categoryPermissions = groupedPermissions[category];
    
    if (action === 'manage' && checked) {
      // When selecting manage, also select view, edit, and delete
      ['view', 'edit', 'delete', 'manage'].forEach(a => {
        if (categoryPermissions[a]) {
          categoryPermissions[a].forEach(p => {
            if (!selectedPermissions.includes(p.id)) {
              onPermissionChange(p.id, true);
            }
          });
        }
      });
    } else if (action === 'manage' && !checked) {
      // When deselecting manage, deselect all related permissions
      Object.keys(categoryPermissions).forEach(a => {
        categoryPermissions[a].forEach(p => {
          if (selectedPermissions.includes(p.id)) {
            onPermissionChange(p.id, false);
          }
        });
      });
    } else {
      // Regular permission toggle
      categoryPermissions[action]?.forEach(p => {
        onPermissionChange(p.id, checked);
      });
      
      // If deselecting view/edit/delete, also deselect manage
      if (!checked && ['view', 'edit', 'delete'].includes(action) && categoryPermissions['manage']) {
        categoryPermissions['manage'].forEach(p => {
          if (selectedPermissions.includes(p.id)) {
            onPermissionChange(p.id, false);
          }
        });
      }
    }
  };

  const isActionSelected = (category: string, action: string) => {
    const categoryPermissions = groupedPermissions[category];
    if (!categoryPermissions[action]) return false;
    return categoryPermissions[action].every(p => selectedPermissions.includes(p.id));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      users: 'bg-blue-100 text-blue-800',
      roles: 'bg-purple-100 text-purple-800',
      clients: 'bg-green-100 text-green-800',
      inventory: 'bg-orange-100 text-orange-800',
      warehouses: 'bg-indigo-100 text-indigo-800',
      orders: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Permissions by Category</Label>
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, actions]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(category)}`}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(actions).map(([action, perms]) => (
                  <div key={`${category}-${action}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${category}-${action}`}
                      checked={isActionSelected(category, action)}
                      onCheckedChange={(checked) => 
                        handleSmartSelection(category, action, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${category}-${action}`} className="text-sm capitalize">
                      {action} {category}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PermissionSelector;

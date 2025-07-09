
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/integrations/supabase/types';

type Permission = Tables<'permissions'>;

interface PermissionsListProps {
  permissions: Permission[];
}

const PermissionsList: React.FC<PermissionsListProps> = ({ permissions }) => {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.name.split('_')[1] || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
    <div className="space-y-6">
      {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={getCategoryColor(category)}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              <span className="text-lg">{category.charAt(0).toUpperCase() + category.slice(1)} Permissions</span>
            </CardTitle>
            <CardDescription>
              Permissions related to {category} management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryPermissions.map((permission) => (
                <div key={permission.id} className="border rounded-lg p-3">
                  <div className="font-medium">
                    {permission.name.replace(/_/g, ' ')}
                  </div>
                  {permission.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {permission.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PermissionsList;

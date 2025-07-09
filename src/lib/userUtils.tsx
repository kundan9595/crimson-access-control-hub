// User-related utility functions
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React from 'react';

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getUserInitials(firstName?: string, lastName?: string) {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '??';
}

export function getUserRoleBadges(userRoles: any[]) {
  if (!userRoles || userRoles.length === 0) {
    return <Badge variant="outline">No roles assigned</Badge>;
  }
  return userRoles.map((userRole: any) => (
    <Badge 
      key={userRole.role_id} 
      variant={userRole.roles?.is_warehouse_admin ? "default" : "secondary"}
      className="mr-1"
    >
      {userRole.roles?.is_warehouse_admin && <Shield className="w-3 h-3 mr-1" />}
      {userRole.roles?.name}
    </Badge>
  ));
}

export function getUserStatusBadge(isActive: boolean) {
  return (
    <Badge variant={isActive ? "default" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
} 
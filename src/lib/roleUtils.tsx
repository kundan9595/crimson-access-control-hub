// Role-related utility functions
import { Badge } from '@/components/ui/badge';
import React from 'react';

// Protected role names that cannot be deleted
const PROTECTED_ROLES = ['Super Admin', 'Warehouse Admin', 'User'];

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getRoleInitials(name?: string) {
  if (!name) return '??';
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function getRoleStatusBadge(isWarehouseAdmin: boolean) {
  return (
    <Badge variant={isWarehouseAdmin ? "default" : "secondary"}>
      {isWarehouseAdmin ? "Warehouse Admin" : "Standard"}
    </Badge>
  );
}

export function isRoleProtected(roleName: string): boolean {
  return PROTECTED_ROLES.includes(roleName);
}


// User-related utility functions
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

export function getUserStatusBadge(isActive: boolean) {
  return (
    <Badge variant={isActive ? "default" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
} 
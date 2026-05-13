import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, X } from 'lucide-react';

interface BulkEditPageShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BulkEditPageShell: React.FC<BulkEditPageShellProps> = ({
  title,
  subtitle,
  onClose,
  children,
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <header className="px-6 py-3 border-b bg-card shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Pencil className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold leading-tight truncate">
                Bulk Edit · {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close bulk edit"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {children}
    </div>
  );
};

export default BulkEditPageShell;

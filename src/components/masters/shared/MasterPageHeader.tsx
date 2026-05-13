
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Download, Upload, Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MasterPageHeaderProps {
  title: string;
  description: string;
  /** Label after "Add " on the primary button. Defaults to title with its last character removed (legacy plural→singular heuristic). */
  addButtonLabel?: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onBulkEdit?: () => void;
  canExport?: boolean;
  showBackButton?: boolean;
  isScottApi?: boolean;
}

interface IconActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

const IconAction: React.FC<IconActionProps> = ({ label, icon, onClick, disabled }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="h-9 w-9"
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

export const MasterPageHeader: React.FC<MasterPageHeaderProps> = ({
  title,
  description,
  addButtonLabel,
  icon,
  onAdd,
  onExport,
  onImport,
  onBulkEdit,
  canExport = true,
  showBackButton = true,
  isScottApi = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {showBackButton && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/masters')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Masters
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-left">{title}</h1>
              {isScottApi && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Scott API
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-left">{description}</p>
          </div>
        </div>

        <TooltipProvider delayDuration={200}>
          <div className="flex gap-2 items-center">
            {onBulkEdit && (
              <IconAction
                label="Bulk Edit"
                icon={<Pencil className="h-4 w-4" />}
                onClick={onBulkEdit}
              />
            )}
            {onExport && (
              <IconAction
                label="Export"
                icon={<Download className="h-4 w-4" />}
                onClick={onExport}
                disabled={!canExport}
              />
            )}
            {onImport && (
              <IconAction
                label="Import"
                icon={<Upload className="h-4 w-4" />}
                onClick={onImport}
              />
            )}
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add {addButtonLabel ?? title.slice(0, -1)}
            </Button>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Upload, Plus } from 'lucide-react';
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
  canExport?: boolean;
  showBackButton?: boolean;
  isScottApi?: boolean;
}

export const MasterPageHeader: React.FC<MasterPageHeaderProps> = ({
  title,
  description,
  addButtonLabel,
  icon,
  onAdd,
  onExport,
  onImport,
  canExport = true,
  showBackButton = true,
  isScottApi = false,
}) => {
  const navigate = useNavigate();

  const handleAddClick = () => {
    onAdd();
  };

  return (
    <div className="space-y-4">
      {/* Back button row - only show if showBackButton is true */}
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
      
      {/* Title and actions row */}
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
        
        <div className="flex gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={!canExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add {addButtonLabel ?? title.slice(0, -1)}
          </Button>
        </div>
      </div>
    </div>
  );
};

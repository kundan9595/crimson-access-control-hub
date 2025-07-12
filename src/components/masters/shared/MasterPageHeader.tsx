
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Upload, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MasterPageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onAdd: () => void;
  onExport?: () => void;
  onImport?: () => void;
  canExport?: boolean;
}

export const MasterPageHeader: React.FC<MasterPageHeaderProps> = ({
  title,
  description,
  icon,
  onAdd,
  onExport,
  onImport,
  canExport = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Back button row */}
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
      
      {/* Title and actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-2xl font-bold text-left">{title}</h1>
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
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add {title.slice(0, -1)}
          </Button>
        </div>
      </div>
    </div>
  );
};

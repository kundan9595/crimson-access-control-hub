
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/masters')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Masters
        </Button>
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            disabled={!canExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        {onImport && (
          <Button variant="outline" onClick={onImport}>
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
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import { MediaFolder } from '@/services/masters/mediaService';

interface MediaBreadcrumbProps {
  currentFolder?: MediaFolder;
  folderHierarchy: MediaFolder[];
  onNavigate: (folder?: MediaFolder) => void;
}

export const MediaBreadcrumb: React.FC<MediaBreadcrumbProps> = ({
  currentFolder,
  folderHierarchy,
  onNavigate,
}) => {
  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate()}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1">Media</span>
      </Button>
      
      {folderHierarchy.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder)}
            className="h-8 px-2 font-medium"
          >
            {folder.name}
          </Button>
        </React.Fragment>
      ))}
      
      {currentFolder && !folderHierarchy.find(f => f.id === currentFolder.id) && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{currentFolder.name}</span>
        </>
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music, 
  Archive,
  Edit,
  Trash2,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaFolder, MediaItem } from '@/services/masters/mediaService';

interface MediaGridProps {
  folders: MediaFolder[];
  items: MediaItem[];
  onFolderClick: (folder: MediaFolder) => void;
  onFolderEdit: (folder: MediaFolder) => void;
  onFolderDelete: (folder: MediaFolder) => void;
  onItemEdit: (item: MediaItem) => void;
  onItemDelete: (item: MediaItem) => void;
  onItemView: (item: MediaItem) => void;
  isLoading?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  folders,
  items,
  onFolderClick,
  onFolderEdit,
  onFolderDelete,
  onItemEdit,
  onItemDelete,
  onItemView,
  isLoading = false,
}) => {
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-8 w-8 text-gray-400" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-8 w-8 text-red-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="h-8 w-8 text-green-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive className="h-8 w-8 text-yellow-500" />;
    }
    
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (mimeType?: string) => {
    return mimeType?.startsWith('image/') || false;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Folders */}
      {folders.map((folder) => (
        <Card key={folder.id} className="hover:shadow-md transition-shadow group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onFolderClick(folder)}
              >
                <div className="flex items-center mb-2">
                  <Folder className="h-8 w-8 text-blue-500 mr-3" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{folder.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{folder.path}</p>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onFolderEdit(folder)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onFolderDelete(folder)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {folder.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{folder.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <Badge variant={folder.status === 'active' ? 'default' : 'secondary'}>
                {folder.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(folder.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Media Items */}
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {isImage(item.mime_type) ? (
                    <img 
                      src={item.file_url} 
                      alt={item.alt_text || item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex items-center justify-center ${isImage(item.mime_type) ? 'hidden' : ''}`}>
                    {getFileIcon(item.mime_type)}
                  </div>
                </div>
                
                <h3 className="font-medium text-sm truncate mb-1">{item.name}</h3>
                <p className="text-xs text-gray-500 truncate">{item.original_name}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onItemView(item)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onItemEdit(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(item.file_url, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onItemDelete(item)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-2">
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(item.file_size)}</span>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {item.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {folders.length === 0 && items.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-gray-500">Start by creating a folder or uploading media files.</p>
        </div>
      )}
    </div>
  );
};

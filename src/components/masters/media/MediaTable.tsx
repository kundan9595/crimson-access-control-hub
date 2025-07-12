
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  MoreVertical,
  Copy,
  FileDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MediaFolder, MediaItem } from '@/services/masters/mediaService';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV } from '@/utils/exportUtils';

interface MediaTableProps {
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

export const MediaTable: React.FC<MediaTableProps> = ({
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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileText className="h-4 w-4 text-gray-400" />;
    
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-red-500" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="h-4 w-4 text-green-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive className="h-4 w-4 text-yellow-500" />;
    }
    
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Success',
        description: 'File link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => 
      checked 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkDownloadCSV = () => {
    const selectedMediaItems = items.filter(item => selectedItems.includes(item.id));
    
    if (selectedMediaItems.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select items to download',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV({
      filename: `media-links-${new Date().toISOString().split('T')[0]}.csv`,
      headers: ['Name', 'Original Name', 'File URL', 'File Size', 'Type'],
      data: selectedMediaItems,
      fieldMap: {
        'Name': 'name',
        'Original Name': 'original_name',
        'File URL': 'file_url',
        'File Size': (item: MediaItem) => formatFileSize(item.file_size),
        'Type': 'mime_type'
      }
    });

    toast({
      title: 'Success',
      description: `Downloaded ${selectedMediaItems.length} file links as CSV`,
    });

    setSelectedItems([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const hasSelectedItems = selectedItems.length > 0;
  const allItemsSelected = selectedItems.length === items.length && items.length > 0;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allItemsSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">
              {hasSelectedItems ? `${selectedItems.length} selected` : 'Select all'}
            </span>
          </div>
          
          {hasSelectedItems && (
            <Button
              onClick={handleBulkDownloadCSV}
              variant="outline"
              size="sm"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download CSV ({selectedItems.length})
            </Button>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {items.length > 0 && (
                  <Checkbox
                    checked={allItemsSelected}
                    onCheckedChange={handleSelectAll}
                  />
                )}
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Folders */}
            {folders.map((folder) => (
              <TableRow key={folder.id} className="hover:bg-muted/50">
                <TableCell></TableCell>
                <TableCell>
                  <div 
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => onFolderClick(folder)}
                  >
                    <Folder className="h-4 w-4 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{folder.name}</p>
                      {folder.description && (
                        <p className="text-xs text-gray-500 truncate">{folder.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">Folder</span>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <Badge variant={folder.status === 'active' ? 'default' : 'secondary'}>
                    {folder.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {new Date(folder.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
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
                </TableCell>
              </TableRow>
            ))}

            {/* Media Items */}
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getFileIcon(item.mime_type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.original_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {item.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {formatFileSize(item.file_size)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onItemView(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(item.file_url)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
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
                </TableCell>
              </TableRow>
            ))}

            {/* Empty State */}
            {folders.length === 0 && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                  <p className="text-gray-500">Start by creating a folder or uploading media files.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

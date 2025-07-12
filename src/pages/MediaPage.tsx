import React, { useState } from 'react';
import { Folder, Plus, Upload } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MediaTable } from '@/components/masters/media/MediaTable';
import { MediaBreadcrumb } from '@/components/masters/media/MediaBreadcrumb';
import { MediaFolderDialog } from '@/components/masters/media/MediaFolderDialog';
import { MediaItemDialog } from '@/components/masters/media/MediaItemDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import {
  useMediaFolders,
  useMediaItemsByFolder,
  useCreateMediaFolder,
  useUpdateMediaFolder,
  useDeleteMediaFolder,
  useCreateMediaItem,
  useUpdateMediaItem,
  useDeleteMediaItem,
} from '@/hooks/masters/useMedia';
import { MediaFolder, MediaItem } from '@/services/masters/mediaService';

const MediaPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<MediaFolder | undefined>();
  const [folderHierarchy, setFolderHierarchy] = useState<MediaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<MediaFolder | undefined>();
  const [selectedItem, setSelectedItem] = useState<MediaItem | undefined>();
  const [viewItem, setViewItem] = useState<MediaItem | undefined>();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showItemView, setShowItemView] = useState(false);

  const { data: allFolders = [], isLoading: foldersLoading, error: foldersError } = useMediaFolders();
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useMediaItemsByFolder(currentFolder?.id);
  const createFolder = useCreateMediaFolder();
  const updateFolder = useUpdateMediaFolder();
  const deleteFolder = useDeleteMediaFolder();
  const createItem = useCreateMediaItem();
  const updateItem = useUpdateMediaItem();
  const deleteItem = useDeleteMediaItem();

  // Get subfolders for current folder
  const subfolders = allFolders.filter(folder => {
    return currentFolder ? folder.parent_id === currentFolder.id : !folder.parent_id;
  });

  // Filter items and folders based on search
  const filteredFolders = subfolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const buildFolderHierarchy = (folderId: string): MediaFolder[] => {
    const hierarchy: MediaFolder[] = [];
    let current = allFolders.find(f => f.id === folderId);
    
    while (current) {
      hierarchy.unshift(current);
      current = current.parent_id ? allFolders.find(f => f.id === current.parent_id) : undefined;
    }
    
    return hierarchy;
  };

  const navigateToFolder = (folder?: MediaFolder) => {
    setCurrentFolder(folder);
    setFolderHierarchy(folder ? buildFolderHierarchy(folder.id) : []);
    setSearchTerm('');
  };

  const handleFolderClick = (folder: MediaFolder) => {
    navigateToFolder(folder);
  };

  const handleAddFolder = () => {
    setSelectedFolder(undefined);
    setShowFolderDialog(true);
  };

  const handleAddItem = () => {
    setSelectedItem(undefined);
    setShowItemDialog(true);
  };

  const handleFolderEdit = (folder: MediaFolder) => {
    setSelectedFolder(folder);
    setShowFolderDialog(true);
  };

  const handleFolderDelete = async (folder: MediaFolder) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This will also delete all contents.`)) {
      try {
        await deleteFolder.mutateAsync(folder.id);
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const handleItemEdit = (item: MediaItem) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleItemDelete = async (item: MediaItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteItem.mutateAsync(item.id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleItemView = (item: MediaItem) => {
    setViewItem(item);
    setShowItemView(true);
  };

  const handleFolderSubmit = async (data: any) => {
    try {
      if (selectedFolder) {
        await updateFolder.mutateAsync({ id: selectedFolder.id, updates: data });
      } else {
        await createFolder.mutateAsync({
          ...data,
          parent_id: currentFolder?.id,
        });
      }
      setShowFolderDialog(false);
      setSelectedFolder(undefined);
    } catch (error) {
      console.error('Failed to save folder:', error);
    }
  };

  const handleItemSubmit = async (data: any) => {
    try {
      if (selectedItem) {
        await updateItem.mutateAsync({ id: selectedItem.id, updates: data });
      } else {
        await createItem.mutateAsync({
          ...data,
          folder_id: currentFolder?.id,
        });
      }
      setShowItemDialog(false);
      setSelectedItem(undefined);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const isImage = (mimeType?: string) => {
    return mimeType?.startsWith('image/') || false;
  };

  const isVideo = (mimeType?: string) => {
    return mimeType?.startsWith('video/') || false;
  };

  const totalCount = filteredFolders.length + filteredItems.length;
  const hasErrors = foldersError || itemsError;

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Media Master"
        description="Manage your media files and folders"
        icon={<Folder className="h-8 w-8 text-purple-600" />}
        onAdd={handleAddFolder}
        canExport={false}
      />

      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load media data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <MediaBreadcrumb
            currentFolder={currentFolder}
            folderHierarchy={folderHierarchy}
            onNavigate={navigateToFolder}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddFolder} variant="outline" disabled={foldersLoading}>
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={handleAddItem} disabled={foldersLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SearchFilter
          placeholder="Search media and folders..."
          value={searchTerm}
          onChange={setSearchTerm}
          resultCount={totalCount}
          totalCount={totalCount}
        />
      </div>

      <MediaTable
        folders={filteredFolders}
        items={filteredItems}
        onFolderClick={handleFolderClick}
        onFolderEdit={handleFolderEdit}
        onFolderDelete={handleFolderDelete}
        onItemEdit={handleItemEdit}
        onItemDelete={handleItemDelete}
        onItemView={handleItemView}
        isLoading={foldersLoading || itemsLoading}
      />

      <MediaFolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        onSubmit={handleFolderSubmit}
        folder={selectedFolder}
        isSubmitting={createFolder.isPending || updateFolder.isPending}
      />

      <MediaItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        onSubmit={handleItemSubmit}
        item={selectedItem}
        currentFolderId={currentFolder?.id}
        isSubmitting={createItem.isPending || updateItem.isPending}
      />

      {/* Media View Dialog */}
      <Dialog open={showItemView} onOpenChange={setShowItemView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.name}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {isImage(viewItem.mime_type) ? (
                  <img 
                    src={viewItem.file_url} 
                    alt={viewItem.alt_text || viewItem.name}
                    className="max-w-full max-h-96 object-contain"
                    onError={(e) => {
                      console.error('Image failed to load:', viewItem.file_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : isVideo(viewItem.mime_type) ? (
                  <video 
                    src={viewItem.file_url} 
                    controls 
                    className="max-w-full max-h-96"
                    onError={(e) => {
                      console.error('Video failed to load:', viewItem.file_url);
                    }}
                  />
                ) : (
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-400 mb-2">
                        <Info className="h-12 w-12 mx-auto mb-2" />
                        <p>Preview not available for this file type</p>
                      </div>
                      <Button
                        onClick={() => window.open(viewItem.file_url, '_blank')}
                        variant="outline"
                      >
                        Open File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Original Name:</p>
                  <p className="text-gray-600">{viewItem.original_name}</p>
                </div>
                <div>
                  <p className="font-medium">File Size:</p>
                  <p className="text-gray-600">
                    {viewItem.file_size ? `${(viewItem.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Type:</p>
                  <p className="text-gray-600">{viewItem.mime_type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-medium">Status:</p>
                  <p className="text-gray-600">{viewItem.status}</p>
                </div>
                {viewItem.alt_text && (
                  <div className="col-span-2">
                    <p className="font-medium">Alt Text:</p>
                    <p className="text-gray-600">{viewItem.alt_text}</p>
                  </div>
                )}
                {viewItem.tags && viewItem.tags.length > 0 && (
                  <div className="col-span-2">
                    <p className="font-medium">Tags:</p>
                    <p className="text-gray-600">{viewItem.tags.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPage;


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  mediaFolderService, 
  mediaItemService, 
  mediaUploadService,
  MediaFolder, 
  MediaItem, 
  CreateMediaFolderData, 
  UpdateMediaFolderData,
  CreateMediaItemData,
  UpdateMediaItemData
} from '@/services/masters/mediaService';

// Media Folders Hooks
export const useMediaFolders = () => {
  return useQuery({
    queryKey: ['media-folders'],
    queryFn: mediaFolderService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

export const useMediaFolder = (id: string) => {
  return useQuery({
    queryKey: ['media-folder', id],
    queryFn: () => mediaFolderService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useMediaSubfolders = (parentId?: string) => {
  return useQuery({
    queryKey: ['media-subfolders', parentId],
    queryFn: () => mediaFolderService.getSubfolders(parentId),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useCreateMediaFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMediaFolderData) => mediaFolderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      queryClient.invalidateQueries({ queryKey: ['media-subfolders'] });
      toast({
        title: 'Success',
        description: 'Folder created successfully',
      });
    },
    onError: (error: any) => {
      console.error('Create folder error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create folder',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateMediaFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMediaFolderData }) => 
      mediaFolderService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      queryClient.invalidateQueries({ queryKey: ['media-subfolders'] });
      toast({
        title: 'Success',
        description: 'Folder updated successfully',
      });
    },
    onError: (error: any) => {
      console.error('Update folder error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update folder',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteMediaFolder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => mediaFolderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      queryClient.invalidateQueries({ queryKey: ['media-subfolders'] });
      toast({
        title: 'Success',
        description: 'Folder deleted successfully',
      });
    },
    onError: (error: any) => {
      console.error('Delete folder error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete folder',
        variant: 'destructive',
      });
    },
  });
};

// Media Items Hooks
export const useMediaItems = () => {
  return useQuery({
    queryKey: ['media-items'],
    queryFn: mediaItemService.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useMediaItemsByFolder = (folderId?: string) => {
  return useQuery({
    queryKey: ['media-items-folder', folderId],
    queryFn: () => mediaItemService.getByFolder(folderId),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useMediaItem = (id: string) => {
  return useQuery({
    queryKey: ['media-item', id],
    queryFn: () => mediaItemService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });
};

export const useCreateMediaItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMediaItemData) => mediaItemService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-items'] });
      queryClient.invalidateQueries({ queryKey: ['media-items-folder'] });
      toast({
        title: 'Success',
        description: 'Media item created successfully',
      });
    },
    onError: (error: any) => {
      console.error('Create media item error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create media item',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateMediaItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateMediaItemData }) => 
      mediaItemService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-items'] });
      queryClient.invalidateQueries({ queryKey: ['media-items-folder'] });
      toast({
        title: 'Success',
        description: 'Media item updated successfully',
      });
    },
    onError: (error: any) => {
      console.error('Update media item error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update media item',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteMediaItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => mediaItemService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-items'] });
      queryClient.invalidateQueries({ queryKey: ['media-items-folder'] });
      toast({
        title: 'Success',
        description: 'Media item deleted successfully',
      });
    },
    onError: (error: any) => {
      console.error('Delete media item error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete media item',
        variant: 'destructive',
      });
    },
  });
};

// File Upload Hook
export const useUploadFile = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: string }) => 
      mediaUploadService.uploadFile(file, folder),
    onError: (error: any) => {
      console.error('Upload file error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });
};

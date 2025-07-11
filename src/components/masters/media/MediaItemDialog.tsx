
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseFormDialog } from '@/components/masters/shared/BaseFormDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MediaItem } from '@/services/masters/mediaService';
import { useMediaFolders, useUploadFile } from '@/hooks/masters/useMedia';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  alt_text: z.string().optional(),
  folder_id: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface MediaItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  item?: MediaItem;
  isSubmitting?: boolean;
  currentFolderId?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MediaItemDialog: React.FC<MediaItemDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  item,
  isSubmitting = false,
  currentFolderId,
}) => {
  const { data: folders = [] } = useMediaFolders();
  const uploadFile = useUploadFile();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      alt_text: '',
      folder_id: currentFolderId || '',
      tags: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        alt_text: item.alt_text || '',
        folder_id: item.folder_id || '',
        tags: item.tags?.join(', ') || '',
        status: item.status,
      });
      setPreviewUrl(item.file_url);
    } else {
      form.reset({
        name: '',
        alt_text: '',
        folder_id: currentFolderId || '',
        tags: '',
        status: 'active',
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setFileError('');
  }, [item, form, currentFolderId]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload images, videos, or documents.';
    }
    
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError('');
    
    if (!file) return;
    
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-fill name from filename if empty
      if (!form.getValues('name')) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        form.setValue('name', nameWithoutExt);
      }
    } catch (error) {
      console.error('Error creating preview URL:', error);
      setFileError('Failed to create file preview');
    }
  };

  const handleSubmit = async (data: ItemFormData) => {
    try {
      // Validate file is selected for new items
      if (!item && !selectedFile) {
        setFileError('Please select a file to upload');
        return;
      }

      let fileUrl = item?.file_url || '';
      let fileSize = item?.file_size;
      let mimeType = item?.mime_type;
      let originalName = item?.original_name || '';

      // Upload new file if selected
      if (selectedFile) {
        try {
          fileUrl = await uploadFile.mutateAsync({ 
            file: selectedFile, 
            folder: data.folder_id 
          });
          fileSize = selectedFile.size;
          mimeType = selectedFile.type;
          originalName = selectedFile.name;
        } catch (error) {
          console.error('File upload failed:', error);
          setFileError('Failed to upload file. Please try again.');
          return;
        }
      }

      // Parse tags
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const submitData = {
        name: data.name,
        alt_text: data.alt_text,
        folder_id: data.folder_id || undefined,
        tags: tags.length > 0 ? tags : undefined,
        status: data.status,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        original_name: originalName,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Submit error:', error);
      setFileError('Failed to save media item. Please try again.');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(item?.file_url || '');
    setFileError('');
    
    // Clear the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('image/');
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov)$/i.test(url) || url.includes('video/');
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? 'Edit Media Item' : 'Add New Media Item'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || uploadFile.isPending}
      isEditing={!!item}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter media name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>File</FormLabel>
          <div className="mt-2">
            {fileError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}
            
            {previewUrl && (
              <div className="mb-4 relative">
                {isImage(previewUrl) ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-32 object-contain border rounded"
                    onError={() => setFileError('Failed to load image preview')}
                  />
                ) : isVideo(previewUrl) ? (
                  <video 
                    src={previewUrl} 
                    controls 
                    className="max-w-full h-32 border rounded"
                    onError={() => setFileError('Failed to load video preview')}
                  />
                ) : (
                  <div className="w-full h-32 border rounded flex items-center justify-center bg-gray-50">
                    <span className="text-sm text-gray-500">
                      {previewUrl.split('/').pop() || 'File preview'}
                    </span>
                  </div>
                )}
                {selectedFile && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isSubmitting || uploadFile.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {item ? 'Replace File' : 'Choose File'}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <span className="text-sm text-gray-500 truncate">
                  {selectedFile.name}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: Images, Videos (MP4, WebM), PDF, Word documents. Max size: 50MB
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="alt_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt Text</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter alt text for accessibility" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="folder_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder</FormLabel>
              <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No Folder (Root Level)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.path}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter tags separated by commas" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </BaseFormDialog>
  );
};

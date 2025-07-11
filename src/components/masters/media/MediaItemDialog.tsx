
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
import { Upload, X } from 'lucide-react';
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
  }, [item, form, currentFolderId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto-fill name from filename if empty
      if (!form.getValues('name')) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        form.setValue('name', nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (data: ItemFormData) => {
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

    onSubmit(submitData);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(item?.file_url || '');
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
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
            {previewUrl && (
              <div className="mb-4 relative">
                {isImage(previewUrl) ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-32 object-contain border rounded"
                  />
                ) : (
                  <div className="w-full h-32 border rounded flex items-center justify-center bg-gray-50">
                    <span className="text-sm text-gray-500">
                      {previewUrl.split('/').pop()}
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
              >
                <Upload className="h-4 w-4 mr-2" />
                {item ? 'Replace File' : 'Choose File'}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <span className="text-sm text-gray-500">
                  {selectedFile.name}
                </span>
              )}
            </div>
            {!item && !selectedFile && (
              <p className="text-sm text-red-500 mt-1">Please select a file to upload</p>
            )}
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


import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseFormDialog } from '@/components/masters/shared/BaseFormDialog';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaFolder } from '@/services/masters/mediaService';
import { useMediaFolders } from '@/hooks/masters/useMedia';

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FolderFormData = z.infer<typeof folderSchema>;

interface MediaFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FolderFormData) => void;
  folder?: MediaFolder;
  isSubmitting?: boolean;
}

export const MediaFolderDialog: React.FC<MediaFolderDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  folder,
  isSubmitting = false,
}) => {
  const { data: allFolders = [] } = useMediaFolders();
  
  const form = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (folder) {
      form.reset({
        name: folder.name,
        description: folder.description || '',
        parent_id: folder.parent_id || '',
        status: folder.status,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        parent_id: '',
        status: 'active',
      });
    }
  }, [folder, form]);

  const availableParents = allFolders.filter(f => f.id !== folder?.id);

  const handleSubmit = (data: FolderFormData) => {
    const submitData = {
      ...data,
      parent_id: data.parent_id === 'root' ? undefined : data.parent_id,
    };
    onSubmit(submitData);
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={folder ? 'Edit Folder' : 'Create New Folder'}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEditing={!!folder}
    >
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Folder Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter folder name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter folder description"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="parent_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Parent Folder</FormLabel>
            <Select 
              onValueChange={(value) => field.onChange(value === 'root' ? '' : value)} 
              value={field.value || 'root'}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent folder (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="root">No Parent (Root Level)</SelectItem>
                {availableParents.map((folder) => (
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
    </BaseFormDialog>
  );
};

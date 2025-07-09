import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PermissionFormProps {
  onSuccess: () => void;
}

const PermissionForm: React.FC<PermissionFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPermissionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Supabase types are too restrictive for dynamic permission creation, so we use 'as any' here.
      const { error } = await supabase
        .from('permissions')
        .insert([{ ...data }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Success',
        description: 'Permission created successfully',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPermissionMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Permission Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={createPermissionMutation.isPending}>
          Create Permission
        </Button>
      </div>
    </form>
  );
};

export default PermissionForm; 
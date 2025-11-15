import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { updateRole } from '@/services/rolesService';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/services/rolesService';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  is_warehouse_admin: z.boolean().default(false),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface EditRoleFormProps {
  role: Role;
  onSuccess: () => void;
}

const EditRoleForm: React.FC<EditRoleFormProps> = ({ role, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role.name,
      description: role.description || '',
      is_warehouse_admin: role.is_warehouse_admin,
    },
  });

  // Update form when role changes
  React.useEffect(() => {
    form.reset({
      name: role.name,
      description: role.description || '',
      is_warehouse_admin: role.is_warehouse_admin,
    });
  }, [role, form]);

  const onSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true);
      await updateRole(role.id, {
        name: data.name,
        description: data.description || null,
        is_warehouse_admin: data.is_warehouse_admin,
      });
      
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter role name" />
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
                  placeholder="Enter role description"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_warehouse_admin"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Warehouse Admin</FormLabel>
                <FormDescription>
                  Grant warehouse administration permissions to this role
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Role'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditRoleForm;


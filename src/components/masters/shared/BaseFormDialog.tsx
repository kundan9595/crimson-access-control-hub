
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface BaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  children: React.ReactNode;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export const BaseFormDialog: React.FC<BaseFormDialogProps> = ({
  open,
  onOpenChange,
  title,
  form,
  onSubmit,
  children,
  isSubmitting = false,
  isEditing = false,
}) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {children}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

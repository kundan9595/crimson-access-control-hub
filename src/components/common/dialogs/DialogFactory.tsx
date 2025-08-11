import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

// Base dialog props interface
export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  onClose?: () => void;
}

// Form dialog props interface
export interface FormDialogProps extends BaseDialogProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  submitText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
}

// Configuration for dialog sizes
const dialogSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-6xl'
};

// Base Dialog Component
export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  size = 'lg',
  showCloseButton = true,
  onClose
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogSizes[size]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// Form Dialog Component
export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  form,
  onSubmit,
  children,
  isSubmitting = false,
  isEditing = false,
  submitText,
  cancelText = 'Cancel',
  showCancelButton = true,
  size = 'lg',
  onClose
}) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  const defaultSubmitText = isEditing ? 'Update' : 'Create';

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size={size}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {children}
          
          <div className="flex justify-end gap-2 pt-4">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText || defaultSubmitText}
            </Button>
          </div>
        </form>
      </Form>
    </BaseDialog>
  );
};

// Dialog Factory for creating specialized dialogs
export interface DialogFactoryConfig<T = any> {
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  submitText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const createFormDialog = <T = any>(config: DialogFactoryConfig<T>) => {
  return (props: Omit<FormDialogProps, 'title' | 'size' | 'submitText' | 'cancelText' | 'showCancelButton'>) => (
    <FormDialog
      {...props}
      title={config.title}
      size={config.size}
      submitText={config.submitText}
      cancelText={config.cancelText}
      showCancelButton={config.showCancelButton}
    />
  );
};

// Specialized dialog creators
export const createMasterDialog = <T = any>(entityName: string) => {
  return createFormDialog<T>({
    title: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`,
    size: 'xl',
    submitText: 'Save',
    showCancelButton: true
  });
};

export const createConfirmationDialog = (title: string, message: string) => {
  return ({ open, onOpenChange, onConfirm, onCancel }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};

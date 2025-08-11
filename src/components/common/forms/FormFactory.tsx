import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseFormDialog } from '@/components/masters/shared/BaseFormDialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { schemas, type BaseProductFormData } from '@/lib/validation/schemas';

// Base entity interface
export interface BaseEntity {
  id: string;
  name: string;
  status: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Form factory configuration
export interface FormFactoryConfig<T extends BaseEntity> {
  schema: z.ZodSchema<T>;
  defaultValues: Partial<T>;
  title: string;
  onSubmit: (data: T) => Promise<void>;
  isEditing?: boolean;
}

// Form factory hook
export const useFormFactory = <T extends BaseEntity>(
  config: FormFactoryConfig<T>
): UseFormReturn<T> => {
  return useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues as T,
  });
};

// Generic form dialog component
export interface FormDialogProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FormFactoryConfig<T>;
  children: React.ReactNode;
  isSubmitting?: boolean;
}

export const FormDialog = <T extends BaseEntity>({
  open,
  onOpenChange,
  config,
  children,
  isSubmitting = false,
}: FormDialogProps<T>) => {
  const form = useFormFactory(config);

  const handleSubmit = async (data: T) => {
    try {
      await config.onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={config.title}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEditing={config.isEditing}
    >
      {children}
    </BaseFormDialog>
  );
};

// Common form field components
export const TextField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  required = false,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            type={type}
            placeholder={placeholder}
            value={field.value as string || ''}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const TextAreaField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  required = false,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Textarea
            {...field}
            placeholder={placeholder}
            value={field.value as string || ''}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const SelectField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  options,
  required = false,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <Select onValueChange={field.onChange} value={field.value as string}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

export const SwitchField = <T extends BaseEntity>({
  form,
  name,
  label,
  description,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  description?: string;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <FormLabel className="text-base">{label}</FormLabel>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        <FormControl>
          <Switch
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        </FormControl>
      </FormItem>
    )}
  />
);

export const NumberField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  min,
  max,
  step,
  required = false,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <FormControl>
          <Input
            {...field}
            type="number"
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            value={field.value as number || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : Number(e.target.value);
              field.onChange(value);
            }}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

// Multi-select component for arrays
export const MultiSelectField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  options,
  required = false,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) => {
  const fieldValue = form.watch(name) as string[] || [];

  const handleToggle = (value: string) => {
    const newValue = fieldValue.includes(value)
      ? fieldValue.filter((v) => v !== value)
      : [...fieldValue, value];
    form.setValue(name as any, newValue);
  };

  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {fieldValue.map((value) => {
                  const option = options.find((opt) => opt.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleToggle(value)}
                    >
                      {option?.label || value}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
              <Select onValueChange={handleToggle}>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options
                    .filter((option) => !fieldValue.includes(option.value))
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Search field component
export const SearchField = <T extends BaseEntity>({
  form,
  name,
  label,
  placeholder,
  onSearch,
}: {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}) => (
  <FormField
    control={form.control}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              {...field}
              placeholder={placeholder}
              className="pl-8"
              onChange={(e) => {
                field.onChange(e);
                onSearch?.(e.target.value);
              }}
            />
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

// Export form factory utilities
export const createFormFactory = <T extends BaseEntity>() => ({
  useForm: (config: FormFactoryConfig<T>) => useFormFactory(config),
  FormDialog: (props: FormDialogProps<T>) => <FormDialog {...props} />,
  TextField: (props: Parameters<typeof TextField>[0]) => <TextField {...props} />,
  TextAreaField: (props: Parameters<typeof TextAreaField>[0]) => <TextAreaField {...props} />,
  SelectField: (props: Parameters<typeof SelectField>[0]) => <SelectField {...props} />,
  SwitchField: (props: Parameters<typeof SwitchField>[0]) => <SwitchField {...props} />,
  NumberField: (props: Parameters<typeof NumberField>[0]) => <NumberField {...props} />,
  MultiSelectField: (props: Parameters<typeof MultiSelectField>[0]) => <MultiSelectField {...props} />,
  SearchField: (props: Parameters<typeof SearchField>[0]) => <SearchField {...props} />,
});

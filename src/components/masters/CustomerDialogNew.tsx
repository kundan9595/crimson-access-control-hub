import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/masters/useCustomers';
import { useStates } from '@/hooks/masters/useStates';
import { useCities } from '@/hooks/masters/useCities';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import { BaseFormDialog } from './shared/BaseFormDialog';
import ImageUpload from '@/components/ui/ImageUpload';
import type { Customer, CustomerAddress } from '@/services/masters/types';
import { customerSchema, type CustomerFormData } from '@/lib/validation/schemas';
import { Plus, Trash2, MapPin } from 'lucide-react';

type CustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
};

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onOpenChange, customer }) => {
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const { data: states = [] } = useStates();
  const { data: priceTypes = [] } = usePriceTypes();
  const isEditing = !!customer;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_code: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      price_type_id: 'none',
      status: 'active',
      credit_limit: 0,
      payment_terms: '',
      gst: '',
      notes: '',
      avatar_url: '',
      addresses: [
        {
          label: 'Main Office',
          type: 'office',
          address: '',
          city_id: '',
          state_id: '',
          postal_code: '',
          is_primary: true,
        }
      ],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'addresses'
  });

  const [selectedStates, setSelectedStates] = useState<Record<number, string>>({});

  // Watch for state changes to fetch cities
  const watchedAddresses = form.watch('addresses');

  useEffect(() => {
    if (customer && open) {
      form.reset({
        customer_code: customer.customer_code,
        company_name: customer.company_name,
        contact_person: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        price_type_id: customer.price_type_id || 'none',
        status: customer.status,
        credit_limit: customer.credit_limit ?? 0,
        payment_terms: customer.payment_terms || '',
        gst: customer.gst || '',
        notes: customer.notes || '',
        avatar_url: customer.avatar_url || '',
        addresses: customer.addresses?.length ? customer.addresses.map(addr => ({
          id: addr.id,
          label: addr.label,
          type: addr.type,
          address: addr.address,
          city_id: addr.city_id,
          state_id: addr.state_id,
          postal_code: addr.postal_code,
          is_primary: addr.is_primary,
        })) : [
          {
            label: 'Main Office',
            type: 'office',
            address: '',
            city_id: '',
            state_id: '',
            postal_code: '',
            is_primary: true,
          }
        ],
      });
    } else if (!customer && open) {
      form.reset({
        customer_code: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        price_type_id: 'none',
        status: 'active',
        credit_limit: 0,
        payment_terms: '',
        gst: '',
        notes: '',
        avatar_url: '',
        addresses: [
          {
            label: 'Main Office',
            type: 'office',
            address: '',
            city_id: '',
            state_id: '',
            postal_code: '',
            is_primary: true,
          }
        ],
      });
    }
  }, [customer, open, form]);

  const onSubmit = (data: CustomerFormData) => {
    const customerData = {
      customer_code: data.customer_code,
      company_name: data.company_name,
      contact_person: data.contact_person,
      email: data.email,
      phone: data.phone,
      price_type_id: data.price_type_id === 'none' ? null : data.price_type_id || null,
      status: data.status,
      credit_limit: data.credit_limit ?? 0,
      payment_terms: data.payment_terms || null,
      gst: data.gst || null,
      notes: data.notes || null,
      avatar_url: data.avatar_url || null,
      addresses: data.addresses.map(addr => ({
        id: addr.id,
        label: addr.label,
        type: addr.type,
        address: addr.address,
        city_id: addr.city_id,
        state_id: addr.state_id,
        postal_code: addr.postal_code,
        is_primary: addr.is_primary,
      })),
    };

    if (isEditing && customer) {
      updateCustomerMutation.mutate(
        { id: customer.id, updates: customerData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          }
        }
      );
    } else {
      createCustomerMutation.mutate(customerData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    }
  };

  const addAddress = () => {
    append({
      label: '',
      type: 'office',
      address: '',
      city_id: '',
      state_id: '',
      postal_code: '',
      is_primary: false,
    });
  };

  const removeAddress = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const setPrimaryAddress = (index: number) => {
    const addresses = form.getValues('addresses');
    const updatedAddresses = addresses.map((addr, i) => ({
      ...addr,
      is_primary: i === index
    }));
    form.setValue('addresses', updatedAddresses);
  };

  return (
    <BaseFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit Customer' : 'Create Customer'}
      form={form}
      onSubmit={onSubmit}
      isSubmitting={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      isEditing={isEditing}
    >
      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center">
          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center">
                <FormLabel className="text-center mb-2">Company Logo/Avatar</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                    onRemove={() => field.onChange('')}
                    placeholder="Upload company logo"
                    maxSize={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Code *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter customer code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_person"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter contact person name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="Enter email address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+91-9876543210" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No Price Type</SelectItem>
                    {priceTypes.map((priceType) => (
                      <SelectItem key={priceType.id} value={priceType.id}>
                        {priceType.name}
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
            name="credit_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_terms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter payment terms" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gst"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="27AABCU9603R1ZX" maxLength={15} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Addresses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses *
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={addAddress}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>

          {fields.map((field, index) => (
            <AddressForm
              key={field.id}
              index={index}
              form={form}
              states={states}
              onRemove={removeAddress}
              onSetPrimary={setPrimaryAddress}
              canRemove={fields.length > 1}
            />
          ))}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter additional notes" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="inactive" />
                    <Label htmlFor="inactive">Inactive</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </BaseFormDialog>
  );
};

// Address Form Component
const AddressForm = ({ 
  index, 
  form, 
  states, 
  onRemove, 
  onSetPrimary, 
  canRemove 
}: {
  index: number;
  form: any;
  states: any[];
  onRemove: (index: number) => void;
  onSetPrimary: (index: number) => void;
  canRemove: boolean;
}) => {
  const { data: cities = [] } = useCities(form.watch(`addresses.${index}.state_id`));

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Address {index + 1}</h4>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPrimary(index)}
          >
            Set Primary
          </Button>
          {canRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`addresses.${index}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Label *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Main Office" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`addresses.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="delivery">Delivery Address</SelectItem>
                  <SelectItem value="billing">Billing Address</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`addresses.${index}.state_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
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
          name={`addresses.${index}.city_id`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch(`addresses.${index}.state_id`)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
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
          name={`addresses.${index}.postal_code`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="400001" maxLength={6} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`addresses.${index}.address`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address *</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Enter full address" rows={2} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export { CustomerDialog };

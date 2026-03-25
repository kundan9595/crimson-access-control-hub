import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateCustomer, useUpdateCustomer, useCustomers } from '@/hooks/masters/useCustomers';
import { useStates } from '@/hooks/masters/useStates';
import { useCities } from '@/hooks/masters/useCities';
import { useZones } from '@/hooks/masters/useZones';
import { useBrands } from '@/hooks/masters/useBrands';
import { BaseFormDialog } from './shared/BaseFormDialog';
import ImageUpload from '@/components/ui/ImageUpload';
import type { Customer, CustomerAddress } from '@/services/masters/types';
import { customerSchema, type CustomerFormData } from '@/lib/validation/schemas';
import { Plus, Trash2, MapPin } from 'lucide-react';

type CustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode?: 'customer' | 'distributor';
};

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onOpenChange, customer, mode = 'customer' }) => {
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const { data: states = [] } = useStates();
  const { data: zones = [] } = useZones();
  const { data: brands = [] } = useBrands();
  const { data: allCustomers = [] } = useCustomers();
  const isEditing = !!customer;

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_code: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      customer_type: mode === 'distributor' ? 'distributor' : 'retail',
      zone_id: '',
      brand_ids: [],
      distributor_ids: [],
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
  const previousZoneIdRef = useRef<string | undefined>(undefined);

  // Watch for state changes to fetch cities
  const watchedAddresses = form.watch('addresses');
  
  // Watch for zone_id changes to reset brands when zone changes
  const watchedZoneId = form.watch('zone_id');
  
  useEffect(() => {
    // Reset brands when zone changes (only for distributors)
    // Only reset if zone actually changed (not on initial load)
    if (mode === 'distributor' && watchedZoneId && previousZoneIdRef.current !== undefined && previousZoneIdRef.current !== watchedZoneId) {
      const currentBrandIds = form.getValues('brand_ids');
      if (currentBrandIds && currentBrandIds.length > 0) {
        form.setValue('brand_ids', []);
        // Clear any brand-related errors
        form.clearErrors('brand_ids');
      }
    }
    // Update the ref to track the current zone
    previousZoneIdRef.current = watchedZoneId;
  }, [watchedZoneId, mode, form]);

  useEffect(() => {
    // Reset the zone ref when dialog opens/closes
    if (!open) {
      previousZoneIdRef.current = undefined;
    }
    
    if (customer && open) {
      previousZoneIdRef.current = customer.zone_id;
      form.reset({
        customer_code: customer.customer_code,
        company_name: customer.company_name,
        contact_person: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        customer_type: customer.customer_type || (mode === 'distributor' ? 'distributor' : 'retail'),
        zone_id: customer.zone_id || '',
        brand_ids: customer.brand_ids || [],
        distributor_ids: customer.distributor_ids || [],
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
        customer_type: mode === 'distributor' ? 'distributor' : 'retail',
        zone_id: '',
        brand_ids: [],
        distributor_ids: [],
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
    // Validate brand uniqueness for distributors in the same zone
    if (data.customer_type === 'distributor' && data.zone_id && data.brand_ids && data.brand_ids.length > 0) {
      // Find other distributors in the same zone
      const otherDistributorsInZone = allCustomers.filter(
        (c) =>
          c.customer_type === 'distributor' &&
          c.zone_id === data.zone_id &&
          (!isEditing || c.id !== customer?.id) &&
          c.brand_ids &&
          c.brand_ids.length > 0
      );

      // Check for brand conflicts
      const conflictingBrands: Array<{ brandId: string; distributorName: string; brandName: string }> = [];
      
      for (const brandId of data.brand_ids) {
        for (const distributor of otherDistributorsInZone) {
          if (distributor.brand_ids?.includes(brandId)) {
            const brandName = brands.find((b) => b.id === brandId)?.name || brandId;
            conflictingBrands.push({
              brandId,
              distributorName: distributor.company_name,
              brandName,
            });
            break; // Only report first conflict per brand
          }
        }
      }

      if (conflictingBrands.length > 0) {
        const conflictMessages = conflictingBrands.map(
          (conflict) => `Brand "${conflict.brandName}" is already assigned to distributor "${conflict.distributorName}"`
        );
        form.setError('brand_ids', {
          type: 'manual',
          message: `Brand conflict: ${conflictMessages.join('; ')}. Distributors in the same zone cannot share brands.`,
        });
        return;
      }
    }

    const customerData: any = {
      customer_code: data.customer_code,
      company_name: data.company_name,
      contact_person: data.contact_person,
      email: data.email,
      phone: data.phone,
      customer_type: data.customer_type,
      zone_id: data.zone_id || null,
      brand_ids: data.brand_ids || [],
      distributor_ids: data.distributor_ids || [],
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
      title={isEditing ? `Edit ${mode === 'distributor' ? 'Distributor' : 'Customer'}` : `Create ${mode === 'distributor' ? 'Distributor' : 'Customer'}`}
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


          {mode === 'customer' && (
            <FormField
              control={form.control}
              name="distributor_ids"
              render={({ field }) => {
                // Get all distributors for selection
                const distributors = allCustomers.filter(
                  (c) => c.customer_type === 'distributor'
                );

                // Helper function to get brand names for a distributor
                const getBrandNames = (distributor: Customer) => {
                  if (!distributor.brand_ids || distributor.brand_ids.length === 0) {
                    return [];
                  }
                  return distributor.brand_ids
                    .map((brandId) => brands.find((b) => b.id === brandId)?.name)
                    .filter((name): name is string => !!name);
                };

                return (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Distributors</FormLabel>
                    <div className="space-y-3 border rounded-md p-4">
                      {distributors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No distributors available
                        </p>
                      ) : (
                        distributors.map((distributor) => {
                          const brandNames = getBrandNames(distributor);
                          const isSelected = field.value?.includes(distributor.id);

                          return (
                            <div
                              key={distributor.id}
                              className={`flex items-start space-x-3 p-3 rounded-md border ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), distributor.id]
                                    : (field.value || []).filter(
                                        (id) => id !== distributor.id
                                      );
                                  field.onChange(newValue);
                                }}
                                className="mt-1 rounded border-gray-300 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {distributor.company_name}
                                  </span>
                                </div>
                                {brandNames.length > 0 ? (
                                  <div className="mt-1.5">
                                    <span className="text-xs text-muted-foreground">
                                      Brands:{' '}
                                    </span>
                                    <span className="text-xs font-medium">
                                      {brandNames.join(', ')}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-1.5">
                                    <span className="text-xs text-muted-foreground italic">
                                      No brands assigned
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  <FormMessage />
                </FormItem>
                );
              }}
            />
          )}



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
          {mode === 'distributor' && (
            <>
              <FormField
                control={form.control}
                name="zone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
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
                name="brand_ids"
                render={({ field }) => {
                  const zoneId = form.watch('zone_id');
                  const currentBrandIds = field.value || [];
                  
                  // Get other distributors in the same zone
                  const otherDistributorsInZone = allCustomers.filter(
                    (c) =>
                      c.customer_type === 'distributor' &&
                      c.zone_id === zoneId &&
                      (!isEditing || c.id !== customer?.id) &&
                      c.brand_ids &&
                      c.brand_ids.length > 0
                  );

                  // Get brands already assigned to other distributors in this zone
                  const unavailableBrandIds = new Set<string>();
                  otherDistributorsInZone.forEach((distributor) => {
                    distributor.brand_ids?.forEach((brandId) => {
                      unavailableBrandIds.add(brandId);
                    });
                  });

                  return (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Brands *</FormLabel>
                    <div className="flex flex-wrap gap-2 border rounded-md p-3">
                        {brands.map((brand) => {
                          const isUnavailable = unavailableBrandIds.has(brand.id);
                          const isSelected = currentBrandIds.includes(brand.id);
                          const isDisabled = isUnavailable && !isSelected;
                          
                          return (
                        <label
                          key={brand.id}
                              className={`flex items-center space-x-2 ${
                                isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                              }`}
                              title={
                                isDisabled
                                  ? `This brand is already assigned to another distributor in this zone`
                                  : undefined
                              }
                        >
                          <input
                            type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                            onChange={(e) => {
                                  if (isDisabled) return;
                              const newValue = e.target.checked
                                    ? [...currentBrandIds, brand.id]
                                    : currentBrandIds.filter((id) => id !== brand.id);
                              field.onChange(newValue);
                                  // Clear any previous errors when user changes selection
                                  if (form.formState.errors.brand_ids) {
                                    form.clearErrors('brand_ids');
                                  }
                            }}
                            className="rounded border-gray-300"
                          />
                              <span className="text-sm">
                                {brand.name}
                                {isDisabled && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    (unavailable)
                                  </span>
                                )}
                              </span>
                        </label>
                          );
                        })}
                    </div>
                    <FormMessage />
                  </FormItem>
                  );
                }}
              />
            </>
          )}
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

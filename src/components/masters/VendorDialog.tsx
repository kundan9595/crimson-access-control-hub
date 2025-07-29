
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateVendor, useUpdateVendor, useStyles, useStates, useCitiesByState } from '@/hooks/useMasters';
import { Vendor } from '@/services/mastersService';

const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  state_id: z.string().optional(),
  city_id: z.string().optional(),
  tax_id: z.string().optional(),
  credit_terms: z.string().optional(),
  style_specializations: z.array(z.string()).default([]),
  status: z.string(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

interface VendorDialogProps {
  vendor?: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VendorDialog = ({ vendor, open, onOpenChange }: VendorDialogProps) => {
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const { data: styles = [] } = useStyles();
  const { data: states = [] } = useStates();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: vendor?.name || '',
      code: vendor?.code || '',
      description: vendor?.description || '',
      contact_person: vendor?.contact_person || '',
      email: vendor?.email || '',
      phone: vendor?.phone || '',
      address: vendor?.address || '',
      state_id: vendor?.state_id || '',
      city_id: vendor?.city_id || '',
      tax_id: vendor?.tax_id || '',
      credit_terms: vendor?.credit_terms || '',
      style_specializations: vendor?.style_specializations || [],
      status: vendor?.status || 'active',
    },
  });

  const selectedStateId = form.watch('state_id');
  const { data: cities = [] } = useCitiesByState(selectedStateId || '');

  // Clear city selection when state changes
  React.useEffect(() => {
    if (selectedStateId !== form.getValues('state_id')) {
      form.setValue('city_id', '');
    }
  }, [selectedStateId, form]);

  React.useEffect(() => {
    if (vendor) {
      form.reset({
        name: vendor.name,
        code: vendor.code,
        description: vendor.description || '',
        contact_person: vendor.contact_person || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        state_id: vendor.state_id || '',
        city_id: vendor.city_id || '',
        tax_id: vendor.tax_id || '',
        credit_terms: vendor.credit_terms || '',
        style_specializations: vendor.style_specializations || [],
        status: vendor.status,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        state_id: '',
        city_id: '',
        tax_id: '',
        credit_terms: '',
        style_specializations: [],
        status: 'active',
      });
    }
  }, [vendor, form]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      const vendorData = {
        name: data.name,
        code: data.code,
        description: data.description || null,
        contact_person: data.contact_person || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        state_id: data.state_id || null,
        city_id: data.city_id || null,
        tax_id: data.tax_id || null,
        credit_terms: data.credit_terms || null,
        style_specializations: data.style_specializations,
        status: data.status,
      };

      if (vendor) {
        await updateVendor.mutateAsync({
          id: vendor.id,
          updates: vendorData,
        });
      } else {
        await createVendor.mutateAsync(vendorData);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const handleStyleToggle = (styleId: string, checked: boolean) => {
    const currentSpecializations = form.getValues('style_specializations');
    if (checked) {
      form.setValue('style_specializations', [...currentSpecializations, styleId]);
    } else {
      form.setValue('style_specializations', currentSpecializations.filter(id => id !== styleId));
    }
  };

  const removeSpecialization = (styleId: string) => {
    const currentSpecializations = form.getValues('style_specializations');
    form.setValue('style_specializations', currentSpecializations.filter(id => id !== styleId));
  };

  const selectedSpecializations = form.watch('style_specializations');
  const activeStyles = styles.filter(style => style.status === 'active');
  const [styleSearchTerm, setStyleSearchTerm] = React.useState('');
  
  // Filter styles based on search term
  const filteredStyles = activeStyles.filter(style =>
    style.name.toLowerCase().includes(styleSearchTerm.toLowerCase()) ||
    (style.description && style.description.toLowerCase().includes(styleSearchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="specializations">Specialisations</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vendor Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter vendor name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter vendor code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter description (optional)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter contact person" />
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter email address" type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter phone number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tax_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GSTIN</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter GSTIN" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        name="city_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value || ''}
                              disabled={!selectedStateId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={selectedStateId ? "Select city" : "Select state first"} />
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="credit_terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Terms</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter credit terms" />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specializations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Style Specialisations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select the styles that this vendor specializes in
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Selected Specializations */}
                    {selectedSpecializations.length > 0 && (
                      <div className="space-y-2">
                        <FormLabel>Selected Specialisations</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {selectedSpecializations.map((styleId) => {
                            const style = activeStyles.find(s => s.id === styleId);
                            return style ? (
                              <Badge key={styleId} variant="secondary" className="flex items-center gap-1">
                                {style.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => removeSpecialization(styleId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available Styles */}
                    <div className="space-y-2">
                      <FormLabel>Available Styles</FormLabel>
                      
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search styles..."
                          value={styleSearchTerm}
                          onChange={(e) => setStyleSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                        {filteredStyles.map((style) => (
                          <div key={style.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={style.id}
                              checked={selectedSpecializations.includes(style.id)}
                              onCheckedChange={(checked) => 
                                handleStyleToggle(style.id, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={style.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {style.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      {activeStyles.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No active styles available
                        </p>
                      )}
                      
                      {activeStyles.length > 0 && filteredStyles.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No styles match your search
                        </p>
                      )}
                      
                      {activeStyles.length > 0 && filteredStyles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Showing {filteredStyles.length} of {activeStyles.length} styles
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createVendor.isPending || updateVendor.isPending}
              >
                {vendor ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDialog;

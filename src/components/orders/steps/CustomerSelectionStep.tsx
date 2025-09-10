import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building2, User, Phone, Mail, CreditCard, Edit } from 'lucide-react';
import { useCustomers } from '@/hooks/masters/useCustomers';
import { useStates } from '@/hooks/masters/useStates';
import { useCities } from '@/hooks/masters/useCities';
import { useZones } from '@/hooks/useZones';
import type { OrderFormData, CustomerAddress } from '@/services/orders/types';
import type { Customer } from '@/services/masters/types';

interface CustomerSelectionStepProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export const CustomerSelectionStep: React.FC<CustomerSelectionStepProps> = ({
  formData,
  updateFormData
}) => {
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingShipTo, setEditingShipTo] = useState(false);
  const [editingBillTo, setEditingBillTo] = useState(false);
  
  const { data: customers = [] } = useCustomers();
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities('');
  const { data: zones = [] } = useZones();

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.company_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.customer_code.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Load selected customer details
  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.company_name);
        
        // Auto-populate addresses and price type if not already set
        if (customer.addresses && customer.addresses.length > 0 && !formData.ship_to_address.address) {
          const primaryAddress = customer.addresses.find(addr => addr.is_primary) || customer.addresses[0];
          const deliveryAddress = customer.addresses.find(addr => addr.type === 'delivery') || primaryAddress;
          const billingAddress = customer.addresses.find(addr => addr.type === 'billing') || primaryAddress;
          
          updateFormData({
            price_type_id: customer.price_type_id,
            ship_to_address: {
              ...deliveryAddress,
              city: deliveryAddress.city || { id: '', name: '' },
              state: deliveryAddress.state || { id: '', name: '' }
            },
            bill_to_address: {
              ...billingAddress,
              city: billingAddress.city || { id: '', name: '' },
              state: billingAddress.state || { id: '', name: '' }
            }
          });
        } else if (!formData.price_type_id) {
          // Set price type even if no addresses
          updateFormData({
            price_type_id: customer.price_type_id
          });
        }
      }
    }
  }, [formData.customer_id, customers, formData.ship_to_address.address, formData.price_type_id, updateFormData]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.company_name);
    
    // Auto-populate addresses and price type
    if (customer.addresses && customer.addresses.length > 0) {
      const primaryAddress = customer.addresses.find(addr => addr.is_primary) || customer.addresses[0];
      const deliveryAddress = customer.addresses.find(addr => addr.type === 'delivery') || primaryAddress;
      const billingAddress = customer.addresses.find(addr => addr.type === 'billing') || primaryAddress;
      
      updateFormData({
        customer_id: customer.id,
        price_type_id: customer.price_type_id,
        ship_to_address: {
          ...deliveryAddress,
          city: deliveryAddress.city || { id: '', name: '' },
          state: deliveryAddress.state || { id: '', name: '' }
        },
        bill_to_address: {
          ...billingAddress,
          city: billingAddress.city || { id: '', name: '' },
          state: billingAddress.state || { id: '', name: '' }
        }
      });
    } else {
      updateFormData({
        customer_id: customer.id,
        price_type_id: customer.price_type_id
      });
    }
  };

  const updateShipToAddress = (updates: Partial<CustomerAddress>) => {
    updateFormData({
      ship_to_address: { ...formData.ship_to_address, ...updates }
    });
  };

  const updateBillToAddress = (updates: Partial<CustomerAddress>) => {
    updateFormData({
      bill_to_address: { ...formData.bill_to_address, ...updates }
    });
  };

  const copyShipToBill = () => {
    updateFormData({
      bill_to_address: { ...formData.ship_to_address, type: 'billing' }
    });
  };

  const getStateById = (stateId: string) => {
    return states.find(state => state.id === stateId);
  };

  const getCityById = (cityId: string) => {
    return cities.find(city => city.id === cityId);
  };

  const getCitiesForState = (stateId: string) => {
    return cities.filter(city => city.state_id === stateId);
  };

  const getZoneForLocation = (stateId: string, cityId: string) => {
    const state = states.find(s => s.id === stateId);
    const city = cities.find(c => c.id === cityId);
    
    if (!state || !city) return null;
    
    return zones.find(zone => 
      zone.locations?.some(loc => loc.state === state.name && loc.city === city.name)
    );
  };

  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search customers by name, code, or email..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {customerSearchTerm && !selectedCustomer && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredCustomers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{customer.company_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.customer_code} • {customer.contact_person}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email} • {customer.phone}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline">{(customer as any).customer_type || 'N/A'}</Badge>
                          {customer.price_type && (
                            <Badge variant="secondary" className="text-xs">
                              {customer.price_type.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No customers found matching "{customerSearchTerm}"
                </div>
              )}
            </div>
          )}

          {selectedCustomer && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{selectedCustomer.company_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.customer_code}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchTerm('');
                    updateFormData({
                      customer_id: '',
                      ship_to_address: {
                        label: '',
                        type: 'delivery',
                        address: '',
                        city: { id: '', name: '' },
                        state: { id: '', name: '' },
                        postal_code: ''
                      },
                      bill_to_address: {
                        label: '',
                        type: 'billing',
                        address: '',
                        city: { id: '', name: '' },
                        state: { id: '', name: '' },
                        postal_code: ''
                      }
                    });
                  }}
                >
                  Change
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.contact_person || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.gst || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Ship To Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ship To Address
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingShipTo(!editingShipTo)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
          {editingShipTo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ship-label">Address Label</Label>
                <Input
                  id="ship-label"
                  value={formData.ship_to_address.label}
                  onChange={(e) => updateShipToAddress({ label: e.target.value })}
                  placeholder="e.g., Head Office, Warehouse"
                />
              </div>
              
              <div>
                <Label htmlFor="ship-type">Address Type</Label>
                <Select
                  value={formData.ship_to_address.type}
                  onValueChange={(value: any) => updateShipToAddress({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ship-address">Address</Label>
                <Input
                  id="ship-address"
                  value={formData.ship_to_address.address}
                  onChange={(e) => updateShipToAddress({ address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <Label htmlFor="ship-state">State</Label>
                <Select
                  value={formData.ship_to_address.state.id}
                  onValueChange={(value) => {
                    const state = getStateById(value);
                    updateShipToAddress({
                      state: { id: value, name: state?.name || '' },
                      city: { id: '', name: '' } // Reset city when state changes
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ship-city">City</Label>
                <Select
                  value={formData.ship_to_address.city.id}
                  onValueChange={(value) => {
                    const city = getCityById(value);
                    updateShipToAddress({
                      city: { id: value, name: city?.name || '' }
                    });
                  }}
                  disabled={!formData.ship_to_address.state.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCitiesForState(formData.ship_to_address.state.id).map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ship-postal">Postal Code</Label>
                <Input
                  id="ship-postal"
                  value={formData.ship_to_address.postal_code}
                  onChange={(e) => updateShipToAddress({ postal_code: e.target.value })}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {formData.ship_to_address.state.id && formData.ship_to_address.city.id && (
                <div>
                  <Label>Zone</Label>
                  <div className="p-2 bg-muted rounded">
                    {getZoneForLocation(formData.ship_to_address.state.id, formData.ship_to_address.city.id)?.name || 'No zone assigned'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg">
              {formData.ship_to_address.address ? (
                <div>
                  <div className="font-medium">{formData.ship_to_address.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formData.ship_to_address.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.ship_to_address.city.name}, {formData.ship_to_address.state.name} - {formData.ship_to_address.postal_code}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No address selected</div>
              )}
            </div>
          )}
      </div>

      {/* Bill To Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bill To Address
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShipToBill}
              disabled={!formData.ship_to_address.address}
            >
              Copy Ship To
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingBillTo(!editingBillTo)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
          {editingBillTo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bill-label">Address Label</Label>
                <Input
                  id="bill-label"
                  value={formData.bill_to_address.label}
                  onChange={(e) => updateBillToAddress({ label: e.target.value })}
                  placeholder="e.g., Head Office, Billing Address"
                />
              </div>
              
              <div>
                <Label htmlFor="bill-type">Address Type</Label>
                <Select
                  value={formData.bill_to_address.type}
                  onValueChange={(value: any) => updateBillToAddress({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="bill-address">Address</Label>
                <Input
                  id="bill-address"
                  value={formData.bill_to_address.address}
                  onChange={(e) => updateBillToAddress({ address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <Label htmlFor="bill-state">State</Label>
                <Select
                  value={formData.bill_to_address.state.id}
                  onValueChange={(value) => {
                    const state = getStateById(value);
                    updateBillToAddress({
                      state: { id: value, name: state?.name || '' },
                      city: { id: '', name: '' }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bill-city">City</Label>
                <Select
                  value={formData.bill_to_address.city.id}
                  onValueChange={(value) => {
                    const city = getCityById(value);
                    updateBillToAddress({
                      city: { id: value, name: city?.name || '' }
                    });
                  }}
                  disabled={!formData.bill_to_address.state.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCitiesForState(formData.bill_to_address.state.id).map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bill-postal">Postal Code</Label>
                <Input
                  id="bill-postal"
                  value={formData.bill_to_address.postal_code}
                  onChange={(e) => updateBillToAddress({ postal_code: e.target.value })}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg">
              {formData.bill_to_address.address ? (
                <div>
                  <div className="font-medium">{formData.bill_to_address.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formData.bill_to_address.address}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.bill_to_address.city.name}, {formData.bill_to_address.state.name} - {formData.bill_to_address.postal_code}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No address selected</div>
              )}
            </div>
          )}
      </div>
    </div>
  );
};

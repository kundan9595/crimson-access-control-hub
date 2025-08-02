import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStates } from '@/hooks/masters/useStates';
import { useCitiesByState } from '@/hooks/masters/useCities';
import { Skeleton } from '@/components/ui/skeleton';

interface BasicInfoStepProps {
  warehouse: {
    name: string;
    description?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    address?: string;
  };
  onWarehouseChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  warehouse,
  onWarehouseChange,
  errors = {}
}) => {
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  
  // Fetch states and cities
  const { data: states, isLoading: statesLoading, error: statesError } = useStates();
  const { data: cities, isLoading: citiesLoading } = useCitiesByState(selectedStateId);

  // Handle state selection
  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    // Find state name by ID
    const selectedState = states?.find(state => state.id === stateId);
    onWarehouseChange('state', selectedState?.name || '');
    // Clear city when state changes
    onWarehouseChange('city', '');
  };

  // Handle city selection
  const handleCityChange = (cityId: string) => {
    const selectedCity = cities?.find(city => city.id === cityId);
    onWarehouseChange('city', selectedCity?.name || '');
  };

  // Initialize state ID when editing
  useEffect(() => {
    if (warehouse.state && states) {
      const state = states.find(s => s.name === warehouse.state);
      if (state) {
        setSelectedStateId(state.id);
      }
    }
  }, [warehouse.state, states]);

  // Find current city ID for the select
  const currentCityId = cities?.find(city => city.name === warehouse.city)?.id || '';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Warehouse Name *</Label>
          <Input
            id="name"
            value={warehouse.name}
            onChange={(e) => onWarehouseChange('name', e.target.value)}
            placeholder="Enter warehouse name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          {statesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedStateId} onValueChange={handleStateChange}>
              <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states?.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {statesError && (
            <p className="text-sm text-red-500">Failed to load states</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          {citiesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select 
              value={currentCityId} 
              onValueChange={handleCityChange}
              disabled={!selectedStateId}
            >
              <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                <SelectValue placeholder={selectedStateId ? "Select city" : "Select state first"} />
              </SelectTrigger>
              <SelectContent>
                {cities?.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!selectedStateId && (
            <p className="text-sm text-gray-500">Please select a state first</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={warehouse.postal_code || ''}
            onChange={(e) => onWarehouseChange('postal_code', e.target.value)}
            placeholder="Enter postal code"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={warehouse.address || ''}
          onChange={(e) => onWarehouseChange('address', e.target.value)}
          placeholder="Enter full address"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={warehouse.description || ''}
          onChange={(e) => onWarehouseChange('description', e.target.value)}
          placeholder="Enter warehouse description"
          rows={3}
        />
      </div>
    </div>
  );
};

export default BasicInfoStep; 
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Filter, X } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@/hooks/masters/useCustomers';
import { useStates } from '@/hooks/masters/useStates';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { VirtualList, VirtualListItem } from '@/components/common';
import EntityImage from '@/components/ui/EntityImage';
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer } from '@/services/masters/types';

interface CustomersListProps {
  onEdit?: (customer: Customer) => void;
}

const CustomersList: React.FC<CustomersListProps> = ({ onEdit }) => {
  const { data: customers, isLoading } = useCustomers();
  const { data: states = [] } = useStates();
  const { data: priceTypes = [] } = usePriceTypes();
  const deleteCustomerMutation = useDeleteCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    priceType: 'all',
    status: 'all',
    state: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleEdit = (customer: Customer) => {
    if (onEdit) {
      onEdit(customer);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomerMutation.mutateAsync(id);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      priceType: 'all',
      status: 'all',
      state: 'all',
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  const filteredCustomers = customers?.filter(customer => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.addresses?.some(addr => 
        addr.city?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.state?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.address.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Price type filter
    const matchesPriceType = filters.priceType === 'all' || 
      customer.price_type_id === filters.priceType;

    // Status filter
    const matchesStatus = filters.status === 'all' || 
      customer.status === filters.status;

    // State filter
    const matchesState = filters.state === 'all' || 
      customer.addresses?.some(addr => addr.state?.id === filters.state);

    return matchesSearch && matchesPriceType && matchesStatus && matchesState;
  }) || [];

  // Sort customers by created_at
  const sortedCustomers = [...filteredCustomers].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Format currency for display
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render customer row for virtual list
  const renderCustomerRow = (customer: Customer) => (
    <TableRow key={customer.id} className="hover:bg-muted/50">
      <TableCell>
        <EntityImage
          imageUrl={customer.avatar_url}
          name={customer.company_name}
          size="sm"
        />
      </TableCell>
      <TableCell className="font-medium">{customer.company_name}</TableCell>
      <TableCell>{customer.contact_person}</TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.phone}</TableCell>
      <TableCell className="text-center">
        <Badge variant="outline" className="font-mono">
          {customer.orders_count || 0}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(customer.lifetime_value)}
      </TableCell>
      <TableCell>
        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
          {customer.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(customer)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(customer.id)}
            disabled={deleteCustomerMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Avatar</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-20 text-center">Orders</TableHead>
                  <TableHead className="w-28 text-right">Lifetime Value</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-6 w-8 mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchFilter
                placeholder="Search customers..."
                value={searchTerm}
                onChange={setSearchTerm}
                resultCount={sortedCustomers.length}
                totalCount={customers?.length || 0}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Price Type
                  </label>
                  <Select
                    value={filters.priceType}
                    onValueChange={(value) => handleFilterChange('priceType', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Price Types</SelectItem>
                      {priceTypes.map((priceType) => (
                        <SelectItem key={priceType.id} value={priceType.id}>
                          {priceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    State
                  </label>
                  <Select
                    value={filters.state}
                    onValueChange={(value) => handleFilterChange('state', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6">
          {sortedCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Avatar</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-20 text-center">Orders</TableHead>
                  <TableHead className="w-28 text-right">Lifetime Value</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Use virtual scrolling for large datasets */}
                {sortedCustomers.length > 100 ? (
                  <VirtualList
                    items={sortedCustomers}
                    height={600}
                    itemHeight={60}
                    renderItem={renderCustomerRow}
                    className="w-full"
                  />
                ) : (
                  sortedCustomers.map(renderCustomerRow)
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No customers found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { CustomersList };

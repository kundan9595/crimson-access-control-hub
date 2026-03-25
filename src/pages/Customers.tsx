import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { CustomersList } from '@/components/masters/CustomersList';
import { CustomerDialog } from '@/components/masters/CustomerDialogNew';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useCustomers } from '@/hooks/masters/useCustomers';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer } from '@/services/masters/types';

const Customers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customer' | 'distributor'>('customer');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { data: customers = [] } = useCustomers();

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerDialog(true);
  };

  const handleDialogClose = () => {
    setShowCustomerDialog(false);
    setEditingCustomer(null);
  };

  // Filter customers by type
  const filteredCustomers = customers.filter(
    (c) => {
      const type = c.customer_type || 'retail';
      // Show retail in the customer tab, distributor in distributor tab
      if (activeTab === 'customer') {
        return type === 'retail';
      } else {
        return type === 'distributor';
      }
    }
  );

  const handleExport = () => {
    if (filteredCustomers.length === 0) {
      return;
    }

    const headers = [
      'Customer Code',
      'Company Name',
      'Contact Person',
      'Email',
      'Phone',
      'City',
      'State',
      'Customer Type',
      'Orders Count',
      'Lifetime Value',
      'Status',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => [
        `"${customer.customer_code}"`,
        `"${customer.company_name || ''}"`,
        `"${customer.contact_person || ''}"`,
        `"${customer.email || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.addresses?.[0]?.city?.name || ''}"`,
        `"${customer.addresses?.[0]?.state?.name || ''}"`,
        `"${customer.customer_type || ''}"`,
        `"${customer.orders_count || 0}"`,
        `"${customer.lifetime_value || 0}"`,
        `"${customer.status}"`,
        new Date(customer.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title={activeTab === 'customer' ? 'Customers' : 'Distributors'}
        description={activeTab === 'customer' ? 'Manage customer information and relationships' : 'Manage distributor information and brand assignments'}
        icon={<Users className="h-6 w-6 text-blue-600" />}
        onAdd={() => setShowCustomerDialog(true)}
        onExport={handleExport}
        onImport={() => setShowImportDialog(true)}
        canExport={!!filteredCustomers?.length}
        showBackButton={false}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'customer' | 'distributor')}>
        <TabsList>
          <TabsTrigger value="customer">Customers</TabsTrigger>
          <TabsTrigger value="distributor">Distributors</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-6">
          <CustomersList onEdit={handleEdit} customerType="customer" />
        </TabsContent>

        <TabsContent value="distributor" className="mt-6">
          <CustomersList onEdit={handleEdit} customerType="distributor" />
        </TabsContent>
      </Tabs>

      <CustomerDialog
        open={showCustomerDialog}
        onOpenChange={handleDialogClose}
        customer={editingCustomer}
        mode={activeTab}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        type="customers"
      />
    </div>
  );
};

export default Customers; 
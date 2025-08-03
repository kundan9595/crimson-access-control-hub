import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Customers: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">
            Manage customer information and relationships
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">Customer functionality coming soon</p>
              <p className="text-sm">This page will contain customer management features.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers; 
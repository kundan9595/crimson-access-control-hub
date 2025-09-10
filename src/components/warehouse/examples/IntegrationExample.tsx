import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, RotateCcw } from 'lucide-react';
import { PutAwayModal, ReturnModal } from '@/components/warehouse';

/**
 * Integration Example Component
 * 
 * This example shows how to integrate the Put Away and Return modals
 * into your existing components. This would typically be placed in
 * your GRN details page, inventory management page, or order details page.
 */
export const IntegrationExample: React.FC = () => {
  // Modal states
  const [isPutAwayOpen, setIsPutAwayOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  
  // Example data - replace with your actual data
  const grnData = {
    id: 'grn-uuid-example',
    grnNumber: 'GRN-2025-001',
    vendorName: 'Example Vendor Ltd',
    status: 'partially_received',
    totalItems: 150,
    receivedItems: 120,
    putAwayItems: 80
  };

  const orderData = {
    id: 'order-uuid-example',
    orderNumber: 'ORD-2025-001',
    customerName: 'John Doe',
    status: 'delivered',
    totalItems: 25,
    returnedItems: 2
  };

  // Refresh functions - called after modal operations complete
  const handleGRNRefresh = () => {
    console.log('Refreshing GRN data after put away operation');
    // Your refresh logic here
  };

  const handleOrderRefresh = () => {
    console.log('Refreshing order data after return operation');
    // Your refresh logic here
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Warehouse Operations Integration Example</h1>
      
      {/* GRN Put Away Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            GRN Put Away Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">GRN Number</p>
              <p className="font-semibold">{grnData.grnNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-semibold">{grnData.vendorName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {grnData.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Put Away Progress</p>
              <p className="font-semibold">
                {grnData.putAwayItems} / {grnData.receivedItems} items
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsPutAwayOpen(true)}
              disabled={grnData.receivedItems === grnData.putAwayItems}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Put Away Items
            </Button>
            
            {grnData.receivedItems === grnData.putAwayItems && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                All items put away
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Returns Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Order Return Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold">{orderData.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-semibold">{orderData.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {orderData.status.replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Returns</p>
              <p className="font-semibold">
                {orderData.returnedItems} / {orderData.totalItems} items
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsReturnOpen(true)}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Process Returns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Put Away Modal: Opens when user clicks "Put Away Items" button
          </p>
          <p className="text-sm text-muted-foreground">
            • Return Modal: Opens when user clicks "Process Returns" button
          </p>
          <p className="text-sm text-muted-foreground">
            • Both modals call refresh functions when operations complete
          </p>
          <p className="text-sm text-muted-foreground">
            • Replace example data with your actual data sources
          </p>
        </CardContent>
      </Card>

      {/* Put Away Modal */}
      <PutAwayModal
        isOpen={isPutAwayOpen}
        onClose={() => setIsPutAwayOpen(false)}
        grnId={grnData.id}
        grnNumber={grnData.grnNumber}
        onRefresh={handleGRNRefresh}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        referenceId={orderData.id}
        referenceType="order"
        referenceNumber={orderData.orderNumber}
        onRefresh={handleOrderRefresh}
      />
    </div>
  );
};

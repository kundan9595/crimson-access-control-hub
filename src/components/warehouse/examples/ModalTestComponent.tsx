import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PutAwayModal, ReturnModal } from '@/components/warehouse';

/**
 * Simple test component to verify modal integration
 * This can be used to test the modals independently
 */
export const ModalTestComponent: React.FC = () => {
  const [isPutAwayOpen, setIsPutAwayOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // Example data - replace with actual data
  const testData = {
    poId: 'test-po-id',
    poNumber: 'PO-TEST-001',
    orderId: 'test-order-id',
    orderNumber: 'ORD-TEST-001'
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Modal Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={() => setIsPutAwayOpen(true)}
              className="flex items-center gap-2"
            >
              Test Put Away Modal
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setIsReturnOpen(true)}
              className="flex items-center gap-2"
            >
              Test Return Modal
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>• Put Away Modal: Uses PO ID {testData.poId}</p>
            <p>• Return Modal: Uses Order ID {testData.orderId}</p>
            <p>• Check browser console for any errors</p>
          </div>
        </CardContent>
      </Card>

      {/* Put Away Modal */}
      <PutAwayModal
        isOpen={isPutAwayOpen}
        onClose={() => setIsPutAwayOpen(false)}
        poId={testData.poId}
        poNumber={testData.poNumber}
        onRefresh={() => console.log('Put away refresh called')}
      />

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        referenceId={testData.orderId}
        referenceType="order"
        referenceNumber={testData.orderNumber}
        onRefresh={() => console.log('Return refresh called')}
      />
    </div>
  );
};

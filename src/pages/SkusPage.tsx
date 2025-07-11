
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SkusList } from '@/components/masters/SkusList';
import { SkuDialog } from '@/components/masters/SkuDialog';

const SkusPage = () => {
  const [showSkuDialog, setShowSkuDialog] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SKU Management</h1>
          <p className="text-muted-foreground">
            Manage your product SKUs with pricing, dimensions, and specifications
          </p>
        </div>
        <Button onClick={() => setShowSkuDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add SKU
        </Button>
      </div>

      <SkusList />

      <SkuDialog
        open={showSkuDialog}
        onOpenChange={setShowSkuDialog}
      />
    </div>
  );
};

export default SkusPage;

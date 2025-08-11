import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Layers, Palette } from 'lucide-react';
import { InventoryViewType } from './types';

interface InventoryViewSelectorProps {
  currentView: InventoryViewType;
  onViewChange: (view: InventoryViewType) => void;
  loading?: boolean;
}

const InventoryViewSelector: React.FC<InventoryViewSelectorProps> = ({
  currentView,
  onViewChange,
  loading = false
}) => {
  return (
    <div className="flex justify-start">
      <Tabs value={currentView} onValueChange={(value) => onViewChange(value as InventoryViewType)}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="sku" disabled={loading} className="flex items-center gap-2 px-3 py-2">
            <Package className="w-4 h-4" />
            SKU View
          </TabsTrigger>
          <TabsTrigger value="class" disabled={loading} className="flex items-center gap-2 px-3 py-2">
            <Layers className="w-4 h-4" />
            Class View
          </TabsTrigger>
          <TabsTrigger value="style" disabled={loading} className="flex items-center gap-2 px-3 py-2">
            <Palette className="w-4 h-4" />
            Style View
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default InventoryViewSelector; 
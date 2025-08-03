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
    <Tabs value={currentView} onValueChange={(value) => onViewChange(value as InventoryViewType)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="sku" disabled={loading} className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          SKU View
        </TabsTrigger>
        <TabsTrigger value="class" disabled={loading} className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Class View
        </TabsTrigger>
        <TabsTrigger value="style" disabled={loading} className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Style View
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default InventoryViewSelector; 
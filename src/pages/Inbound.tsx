import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Upload, 
  Download, 
  Plus,
  Package,
  Truck,
  ClipboardList
} from 'lucide-react';

// Import tab components
import PurchaseOrderTab from '@/components/inbound/PurchaseOrderTab';
import GRNTab from '@/components/inbound/GRNTab';
import MaterialPlanningTab from '@/components/inbound/MaterialPlanningTab';

type InboundTabType = 'purchase-order' | 'grn' | 'material-planning';

const Inbound: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InboundTabType>('purchase-order');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbound</h1>
          <p className="text-muted-foreground">
            Manage purchase orders, goods receipt notes, and material planning
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as InboundTabType)}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="purchase-order" className="flex items-center gap-2 px-3 py-2">
            <ClipboardList className="w-4 h-4" />
            Purchase Order
          </TabsTrigger>
          <TabsTrigger value="grn" className="flex items-center gap-2 px-3 py-2">
            <Truck className="w-4 h-4" />
            GRN
          </TabsTrigger>
          <TabsTrigger value="material-planning" className="flex items-center gap-2 px-3 py-2">
            <Package className="w-4 h-4" />
            Material Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase-order" className="space-y-4">
          <PurchaseOrderTab />
        </TabsContent>

        <TabsContent value="grn" className="space-y-4">
          <GRNTab />
        </TabsContent>

        <TabsContent value="material-planning" className="space-y-4">
          <MaterialPlanningTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inbound; 
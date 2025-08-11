import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RotateCcw } from 'lucide-react';

const MaterialPlanningTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for material planning
  const materials = [
    {
      sku: 'SKU001',
      name: 'Product A',
      inventory: 150,
      minThreshold: 100,
      optimal: 300,
      status: 'Normal',
      autoReorder: true,
      preferredVendor: 'Vendor A'
    },
    {
      sku: 'SKU002',
      name: 'Product B',
      inventory: 50,
      minThreshold: 75,
      optimal: 200,
      status: 'Low',
      autoReorder: false,
      preferredVendor: 'Vendor B'
    },
    {
      sku: 'SKU003',
      name: 'Product C',
      inventory: 200,
      minThreshold: 150,
      optimal: 400,
      status: 'Normal',
      autoReorder: true,
      preferredVendor: 'Vendor A'
    },
    {
      sku: 'SKU004',
      name: 'Product D',
      inventory: 25,
      minThreshold: 50,
      optimal: 150,
      status: 'Critical',
      autoReorder: true,
      preferredVendor: 'Vendor C'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Normal': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      'Low': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      'Critical': { variant: 'secondary' as const, className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Normal'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Material Planning Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Optimal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto Reorder</TableHead>
                <TableHead>Preferred Vendor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.sku}>
                  <TableCell className="font-medium">{material.sku}</TableCell>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.inventory}</TableCell>
                  <TableCell>{material.minThreshold}</TableCell>
                  <TableCell>{material.optimal}</TableCell>
                  <TableCell>{getStatusBadge(material.status)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={material.autoReorder}
                      onCheckedChange={() => {}}
                      className="data-[state=checked]:bg-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={material.preferredVendor} onValueChange={() => {}}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vendor A">Vendor A</SelectItem>
                        <SelectItem value="Vendor B">Vendor B</SelectItem>
                        <SelectItem value="Vendor C">Vendor C</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialPlanningTab;

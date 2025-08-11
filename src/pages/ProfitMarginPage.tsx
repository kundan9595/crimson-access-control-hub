
import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { ProfitMarginDialog } from '@/components/masters/ProfitMarginDialog';
import { useProfitMargins, useDeleteProfitMargin } from '@/hooks/masters/useProfitMargins';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';

const ProfitMarginPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProfitMargin, setSelectedProfitMargin] = useState<ProfitMargin | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: profitMargins = [], isLoading } = useProfitMargins();
  const deleteProfitMarginMutation = useDeleteProfitMargin();
  const { toast } = useToast();

  const filteredProfitMargins = profitMargins.filter((profitMargin) =>
    profitMargin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedProfitMargin(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (profitMargin: ProfitMargin) => {
    setSelectedProfitMargin(profitMargin);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this profit margin?')) {
      try {
        await deleteProfitMarginMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting profit margin:', error);
      }
    }
  };

  const handleExport = () => {
    if (profitMargins.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no profit margins to export.",
        variant: "destructive",
      });
      return;
    }

    const exportConfig = {
      filename: generateExportFilename('profit-margins'),
      headers: [
        'Name',
        'Min Range',
        'Max Range',
        'Margin Percentage',
        'Branding Print',
        'Branding Embroidery',
        'Status',
        'Created At'
      ],
      data: profitMargins,
      fieldMap: {
        'Name': 'name',
        'Min Range': 'min_range',
        'Max Range': 'max_range',
        'Margin Percentage': (item: any) => `${item.margin_percentage}%`,
        'Branding Print': (item: any) => `${item.branding_print}%`,
        'Branding Embroidery': (item: any) => `${item.branding_embroidery}%`,
        'Status': 'status',
        'Created At': (item: any) => new Date(item.created_at).toLocaleDateString()
      }
    };

    exportToCSV(exportConfig);
    toast({
      title: "Export successful",
      description: `${profitMargins.length} profit margins exported successfully.`,
    });
  };

  const handleImport = () => {
    setShowImportDialog(true);
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatRange = (min: number, max: number) => `${min} - ${max}`;

  const importTemplateHeaders = [
    'name',
    'min_range',
    'max_range',
    'margin_percentage',
    'branding_print',
    'branding_embroidery',
    'status'
  ];

  const importSampleData = [
    ['Standard Margin', '0', '1000', '10.00', '5.00', '8.00', 'active'],
    ['Premium Margin', '1001', '5000', '15.00', '7.50', '10.00', 'active'],
    ['Bulk Margin', '5001', '10000', '8.00', '3.00', '5.00', 'active']
  ];

  if (isLoading) {
    return <div className="text-center">Loading profit margins...</div>;
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Profit Margins"
        description="Configure profit margins and pricing strategies"
        icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={profitMargins.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search profit margins..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredProfitMargins.length}
            totalCount={profitMargins.length}
          />
          
          <div className="mt-6">
            {filteredProfitMargins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Print %</TableHead>
                    <TableHead>Embroidery %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfitMargins.map((profitMargin) => (
                    <TableRow key={profitMargin.id}>
                      <TableCell className="font-medium">{profitMargin.name}</TableCell>
                      <TableCell>{formatRange(profitMargin.min_range, profitMargin.max_range)}</TableCell>
                      <TableCell>{formatPercentage(profitMargin.margin_percentage)}</TableCell>
                      <TableCell>{formatPercentage(profitMargin.branding_print)}</TableCell>
                      <TableCell>{formatPercentage(profitMargin.branding_embroidery)}</TableCell>
                      <TableCell>
                        <Badge variant={profitMargin.status === 'active' ? 'default' : 'secondary'}>
                          {profitMargin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(profitMargin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(profitMargin)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(profitMargin.id)}
                            disabled={deleteProfitMarginMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No profit margins found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ProfitMarginDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        profitMargin={selectedProfitMargin}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        type="profitMargins"
        templateHeaders={importTemplateHeaders}
        sampleData={importSampleData}
      />
    </div>
  );
};

export default ProfitMarginPage;

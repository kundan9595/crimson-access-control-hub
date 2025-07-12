
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { ProfitMarginsList } from '@/components/masters/ProfitMarginsList';
import { BulkImportDialog } from '@/components/masters/BulkImportDialog';
import { useProfitMargins } from '@/hooks/masters/useProfitMargins';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

const ProfitMarginPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  const { data: profitMargins = [] } = useProfitMargins();
  const { toast } = useToast();

  const filteredCount = profitMargins.filter((profitMargin) =>
    profitMargin.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).length;

  const handleAdd = () => {
    // This will be handled by the ProfitMarginsList component
    console.log('Add profit margin clicked');
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Profit Margin"
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
            resultCount={filteredCount}
            totalCount={profitMargins.length}
          />
        </CardContent>
      </Card>

      <ProfitMarginsList searchTerm={searchTerm} />

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


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkusList } from '@/components/masters/SkusList';
import { SkuDialog } from '@/components/masters/SkuDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useSkus } from '@/hooks/masters/useSkus';

const SkusPage = () => {
  const [showSkuDialog, setShowSkuDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const navigate = useNavigate();
  const { data: skus = [] } = useSkus();

  const handleExport = () => {
    if (skus.length === 0) {
      return;
    }

    const headers = [
      'SKU Code',
      'Class Name',
      'Size Name',
      'Base MRP',
      'Cost Price',
      'HSN Code',
      'Description',
      'Length (cm)',
      'Breadth (cm)',
      'Height (cm)',
      'Weight (grams)',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...skus.map(sku => [
        `"${sku.sku_code}"`,
        `"${sku.class?.name || ''}"`,
        `"${sku.size?.name || ''}"`,
        sku.base_mrp || '',
        sku.cost_price || '',
        `"${sku.hsn_code || ''}"`,
        `"${sku.description || ''}"`,
        sku.length_cm || '',
        sku.breadth_cm || '',
        sku.height_cm || '',
        sku.weight_grams || '',
        `"${sku.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skus-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTemplateHeaders = [
    'SKU Code',
    'Class ID',
    'Size ID',
    'Base MRP',
    'Cost Price',
    'HSN Code',
    'Description',
    'Length (cm)',
    'Breadth (cm)',
    'Height (cm)',
    'Weight (grams)',
    'Status'
  ];

  const importSampleData = [
    [
      'SKU001',
      'class-uuid-here',
      'size-uuid-here',
      '1000',
      '800',
      '62011090',
      'Sample SKU description',
      '30',
      '20',
      '10',
      '500',
      'active'
    ],
    [
      'SKU002',
      'class-uuid-here',
      'size-uuid-here',
      '1500',
      '1200',
      '62011090',
      'Another sample SKU',
      '25',
      '15',
      '8',
      '400',
      'active'
    ]
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/masters')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Masters
          </Button>
          <div>
            <h1 className="text-3xl font-bold">SKU Management</h1>
            <p className="text-muted-foreground">
              Manage your product SKUs with pricing, dimensions, and specifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={skus.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setShowSkuDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add SKU
          </Button>
        </div>
      </div>

      <SkusList />

      <SkuDialog
        open={showSkuDialog}
        onOpenChange={setShowSkuDialog}
      />

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        type="skus"
        templateHeaders={importTemplateHeaders}
        sampleData={importSampleData}
      />
    </div>
  );
};

export default SkusPage;

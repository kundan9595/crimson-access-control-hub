
import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { SkusList } from '@/components/masters/SkusList';
import { SkuDialog } from '@/components/masters/SkuDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useSkus } from '@/hooks/masters/useSkus';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';

const SkusPage = () => {
  const [showSkuDialog, setShowSkuDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
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
      'GST Rate (%)',
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
        sku.gst_rate || '',
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
    'GST Rate (%)',
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
      '18',
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
      '12',
      'active'
    ]
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="SKUs"
        description="Manage your product SKUs with pricing, dimensions, and specifications"
        icon={<Package className="h-8 w-8" />}
        onAdd={() => setShowSkuDialog(true)}
        onExport={handleExport}
        onImport={() => setShowImportDialog(true)}
        canExport={skus.length > 0}
      />

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

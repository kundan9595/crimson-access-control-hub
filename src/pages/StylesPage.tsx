
import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Palette } from 'lucide-react';
import { StylesList } from '@/components/masters/StylesList';
import { StyleDialog } from '@/components/masters/StyleDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useStyles } from '@/hooks/useMasters';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';

const StylesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: styles } = useStyles();

  const handleExport = () => {
    if (!styles || styles.length === 0) return;

    const headers = ['Name', 'Description', 'Brand', 'Category', 'Status'];
    const csvContent = [
      headers.join(','),
      ...styles.map(style => [
        `"${style.name}"`,
        `"${style.description || ''}"`,
        `"${style.brand?.name || ''}"`,
        `"${style.category?.name || ''}"`,
        `"${style.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'styles.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateHeaders = ['Name', 'Description', 'Brand ID', 'Category ID', 'Status'];
  const sampleData = [
    ['Summer Collection', 'Lightweight summer clothing', '', '', 'active'],
    ['Winter Collection', 'Warm winter clothing', '', '', 'active']
  ];

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Styles"
        description="Manage your product styles and their variations"
        icon={<Palette className="h-8 w-8" />}
        onAdd={() => setIsDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setIsImportDialogOpen(true)}
        canExport={!!(styles && styles.length > 0)}
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">All Styles</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
          <StylesList searchTerm={searchTerm} />
        </CardContent>
      </Card>

      <ErrorBoundary>
        <StyleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </ErrorBoundary>

      <BulkImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        type="styles"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default StylesPage;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft, Download, Upload, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StylesList } from '@/components/masters/StylesList';
import { StyleDialog } from '@/components/masters/StyleDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useStyles } from '@/hooks/useMasters';

const StylesPage = () => {
  const navigate = useNavigate();
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/masters')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Masters
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Styles</h1>
            <p className="text-muted-foreground">
              Manage your product styles and their variations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Style
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Styles</CardTitle>
            <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent>
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

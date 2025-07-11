import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shirt, ArrowLeft, Download, Upload } from 'lucide-react';
import ClassesList from '@/components/masters/ClassesList';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { useClasses } from '@/hooks/masters/useClasses';

const ClassesPage = () => {
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { data: classes = [] } = useClasses();

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Description', 'Style ID', 'Color ID', 'Size Group ID', 'GST Rate', 'Sort Order', 'Status'].join(','),
      ...classes.map(cls => [
        `"${cls.name}"`,
        `"${cls.description || ''}"`,
        `"${cls.style_id || ''}"`,
        `"${cls.color_id || ''}"`,
        `"${cls.size_group_id || ''}"`,
        cls.gst_rate || 0,
        cls.sort_order || 0,
        cls.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateHeaders = ['Name', 'Description', 'Style ID', 'Color ID', 'Size Group ID', 'GST Rate', 'Sort Order', 'Status'];
  const sampleData = [
    ['Summer T-Shirt Red', 'Red variant of summer t-shirt', 'style-uuid-1', 'color-uuid-1', 'size-group-uuid-1', '18', '1', 'active'],
    ['Winter Jacket Blue', 'Blue winter jacket', 'style-uuid-2', 'color-uuid-2', 'size-group-uuid-2', '12', '2', 'active']
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/masters')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Masters</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Shirt className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-3xl font-bold">Classes</h1>
              <p className="text-muted-foreground">
                Manage product classes with styles, colors, and images
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Management</CardTitle>
          <CardDescription>
            Create and manage product classes that combine styles and colors with detailed information and images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassesList />
        </CardContent>
      </Card>

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="classes"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default ClassesPage;


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, DollarSign, ArrowLeft, Download, Upload } from 'lucide-react';
import { usePriceTypes, useDeletePriceType } from '@/hooks/useMasters';
import { PriceType } from '@/services/mastersService';
import { useSearchParams, Link } from 'react-router-dom';
import PriceTypeDialog from '@/components/masters/PriceTypeDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';

const PriceTypesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPriceType, setEditingPriceType] = useState<PriceType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const { data: priceTypes, isLoading } = usePriceTypes();
  const deletePriceType = useDeletePriceType();

  const filteredPriceTypes = priceTypes?.filter(priceType =>
    priceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (priceType: PriceType) => {
    setEditingPriceType(priceType);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this price type?')) {
      deletePriceType.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPriceType(null);
    setSearchParams({});
  };

  const handleExport = () => {
    if (!filteredPriceTypes?.length) return;

    const csvContent = [
      ['Name', 'Description', 'Status', 'Created Date'].join(','),
      ...filteredPriceTypes.map(priceType => [
        `"${priceType.name}"`,
        `"${priceType.description || ''}"`,
        priceType.status,
        new Date(priceType.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-types-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateHeaders = ['Name', 'Description', 'Status'];
  const sampleData = [
    ['Wholesale', 'Bulk pricing for wholesale customers', 'active'],
    ['Retail', 'Standard retail pricing', 'active']
  ];

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/masters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Masters
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Price Types
            </h1>
            <p className="text-muted-foreground">Configure pricing structures</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!filteredPriceTypes?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Price Type
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Price Types</CardTitle>
          <CardDescription>Find price types by name or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search price types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredPriceTypes?.map((priceType) => (
          <Card key={priceType.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{priceType.name}</h3>
                    <Badge variant={priceType.status === 'active' ? 'default' : 'secondary'}>
                      {priceType.status}
                    </Badge>
                  </div>
                  {priceType.description && (
                    <p className="text-muted-foreground mb-2">{priceType.description}</p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(priceType.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(priceType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(priceType.id)}
                    disabled={deletePriceType.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPriceTypes?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Price Types Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No price types match your search criteria.' : 'Get started by creating your first price type.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Price Type
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PriceTypeDialog
        priceType={editingPriceType}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="priceTypes"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default PriceTypesPage;

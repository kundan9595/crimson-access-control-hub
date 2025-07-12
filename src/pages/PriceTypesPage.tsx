
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { usePriceTypes, useDeletePriceType } from '@/hooks/useMasters';
import { PriceType } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import PriceTypeDialog from '@/components/masters/PriceTypeDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const PriceTypesPage = () => {
  const { data: priceTypes, isLoading } = usePriceTypes();
  const deletePriceType = useDeletePriceType();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPriceType, setEditingPriceType] = useState<PriceType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleEdit = (priceType: PriceType) => {
    setEditingPriceType(priceType);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this price type?')) {
      deletePriceType.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPriceType(null);
  };

  const handleExport = () => {
    if (!priceTypes || priceTypes.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Status', 'Created Date'].join(','),
      ...priceTypes.map(priceType => [
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

  const filteredPriceTypes = priceTypes?.filter(priceType =>
    priceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="text-center">Loading price types...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Price Types"
        description="Configure pricing structures"
        icon={<DollarSign className="h-6 w-6 text-blue-600" />}
        onAdd={() => setIsDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setIsBulkImportOpen(true)}
        canExport={!!priceTypes?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search price types..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredPriceTypes.length}
            totalCount={priceTypes?.length || 0}
          />
          
          <div className="mt-6">
            {filteredPriceTypes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPriceTypes.map((priceType) => (
                    <TableRow key={priceType.id}>
                      <TableCell className="font-medium">{priceType.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{priceType.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={priceType.status === 'active' ? 'default' : 'secondary'}>
                          {priceType.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(priceType.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No price types found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PriceTypeDialog
        priceType={editingPriceType}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="priceTypes"
        templateHeaders={['Name', 'Description', 'Status']}
        sampleData={[
          ['Wholesale', 'Bulk pricing for wholesale customers', 'active'],
          ['Retail', 'Standard retail pricing', 'active']
        ]}
      />
    </div>
  );
};

export default PriceTypesPage;

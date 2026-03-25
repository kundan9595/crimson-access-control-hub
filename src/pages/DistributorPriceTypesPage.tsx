import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, DollarSign, ArrowLeft, Plus } from 'lucide-react';
import { usePriceTypes, useDeletePriceType } from '@/hooks/masters/usePriceTypes';
import { PriceType } from '@/services/masters/types';
import PriceTypeDialog from '@/components/masters/PriceTypeDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { useCustomers } from '@/hooks/masters/useCustomers';
import { Skeleton } from '@/components/ui/skeleton';

const DistributorPriceTypesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: priceTypes, isLoading } = usePriceTypes(id);
  const { data: customers } = useCustomers();
  const deletePriceType = useDeletePriceType();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPriceType, setEditingPriceType] = useState<PriceType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get distributor info
  const distributor = customers?.find(c => c.id === id && c.customer_type === 'distributor');

  useEffect(() => {
    // Redirect if distributor not found or not a distributor
    if (customers && id) {
      const customer = customers.find(c => c.id === id);
      if (!customer || customer.customer_type !== 'distributor') {
        navigate('/customers');
      }
    }
  }, [customers, id, navigate]);

  const handleEdit = (priceType: PriceType) => {
    setEditingPriceType(priceType);
    setIsDialogOpen(true);
  };

  const handleDelete = async (priceTypeId: string) => {
    if (confirm('Are you sure you want to delete this price type?')) {
      deletePriceType.mutate(priceTypeId);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPriceType(null);
  };

  const handleCreate = () => {
    setEditingPriceType(null);
    setIsDialogOpen(true);
  };

  const filteredPriceTypes = priceTypes?.filter(priceType =>
    priceType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    priceType.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading || !customers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Distributor not found</p>
          <Button onClick={() => navigate('/customers')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-left">{`Price Types - ${distributor.company_name}`}</h1>
              <p className="text-muted-foreground text-left">{`Manage price types for ${distributor.company_name}`}</p>
            </div>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Price Type
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {filteredPriceTypes.length === 0 && !searchTerm ? (
            // Empty state
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No price types yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first price type for this distributor.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Price Type
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

      <PriceTypeDialog
        priceType={editingPriceType}
        distributorId={id}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </div>
  );
};

export default DistributorPriceTypesPage;


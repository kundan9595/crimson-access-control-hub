
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { useProfitMargins, useDeleteProfitMargin } from '@/hooks/masters/useProfitMargins';
import { ProfitMarginDialog } from './ProfitMarginDialog';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';

interface ProfitMarginsListProps {
  searchTerm: string;
}

export const ProfitMarginsList: React.FC<ProfitMarginsListProps> = ({ searchTerm }) => {
  const [selectedProfitMargin, setSelectedProfitMargin] = useState<ProfitMargin | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profitMargins = [], isLoading } = useProfitMargins();
  const deleteProfitMarginMutation = useDeleteProfitMargin();

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

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatRange = (min: number, max: number) => `${min} - ${max}`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profit margins...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profit Margins ({filteredProfitMargins.length})</CardTitle>
          <Button onClick={handleAdd}>Add Profit Margin</Button>
        </CardHeader>
        <CardContent>
          {filteredProfitMargins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No profit margins found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(profitMargin)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(profitMargin.id)}
                            title="Delete"
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
            </div>
          )}
        </CardContent>
      </Card>

      <ProfitMarginDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        profitMargin={selectedProfitMargin}
      />
    </>
  );
};

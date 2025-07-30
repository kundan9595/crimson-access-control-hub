
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useFabrics, useDeleteFabric } from '@/hooks/masters/useFabrics';
import { FabricDialog } from './FabricDialog';
import { Fabric } from '@/services/masters/types';

interface FabricsListProps {
  searchTerm: string;
}

export const FabricsList: React.FC<FabricsListProps> = ({ searchTerm }) => {
  const { data: fabrics = [], isLoading } = useFabrics();
  const deleteFabric = useDeleteFabric();
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredFabrics = fabrics.filter((fabric) =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fabric.fabric_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (fabric: Fabric) => {
    setEditingFabric(fabric);
    setDialogOpen(true);
  };

  const handleDelete = async (fabricId: string) => {
    if (window.confirm('Are you sure you want to delete this fabric?')) {
      await deleteFabric.mutateAsync(fabricId);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingFabric(null);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading fabrics...</div>;
  }

  if (filteredFabrics.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No fabrics found</p>
        {searchTerm && (
          <p className="text-sm">Try adjusting your search terms</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFabrics.map((fabric) => (
              <TableRow key={fabric.id}>
                <TableCell>
                  {fabric.image_url ? (
                    <img
                      src={fabric.image_url}
                      alt={fabric.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{fabric.name}</TableCell>
                <TableCell>{fabric.fabric_type}</TableCell>
                <TableCell>{fabric.gsm}</TableCell>
                <TableCell>{fabric.uom}</TableCell>
                <TableCell>₹{fabric.price}</TableCell>
                <TableCell>
                  {fabric.colors && fabric.colors.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {fabric.colors.map((color) => (
                        <div key={color.id} className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <span className="text-xs">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No colors</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={fabric.status === 'active' ? 'default' : 'secondary'}>
                    {fabric.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(fabric)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(fabric.id)}
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

      <FabricDialog
        fabric={editingFabric}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
};

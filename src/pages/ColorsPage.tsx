
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useColors, useDeleteColor } from '@/hooks/useMasters';
import { useSearchParams } from 'react-router-dom';
import ColorDialog from '@/components/masters/ColorDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import type { Color } from '@/services/mastersService';

const ColorsPage = () => {
  const { data: colors, isLoading } = useColors();
  const deleteColorMutation = useDeleteColor();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this color?')) {
      deleteColorMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingColor(null);
  };

  const handleExport = () => {
    if (!colors || colors.length === 0) return;

    const csvContent = [
      ['Name', 'Hex Code', 'Status', 'Created At'].join(','),
      ...colors.map(color => [
        `"${color.name}"`,
        color.hex_code,
        color.status,
        new Date(color.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `colors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredColors = colors?.filter(color =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    color.hex_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="text-center">Loading colors...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Colors"
        description="Manage your color palette"
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={!!colors?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search colors..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredColors.length}
            totalCount={colors?.length || 0}
          />
          
          <div className="mt-6">
            {filteredColors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Hex Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColors.map((color) => (
                    <TableRow key={color.id}>
                      <TableCell>
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: color.hex_code }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{color.name}</TableCell>
                      <TableCell className="font-mono">{color.hex_code}</TableCell>
                      <TableCell>
                        <Badge variant={color.status === 'active' ? 'default' : 'secondary'}>
                          {color.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(color.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(color)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(color.id)}
                            disabled={deleteColorMutation.isPending}
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
                <p>No colors found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ColorDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        color={editingColor}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="colors"
        templateHeaders={['Name', 'Hex Code', 'Status']}
        sampleData={[
          ['Red', '#FF0000', 'active'],
          ['Blue', '#0000FF', 'active']
        ]}
      />
    </div>
  );
};

export default ColorsPage;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Search, Plus, ArrowLeft } from 'lucide-react';
import { useColors, useDeleteColor } from '@/hooks/useMasters';
import { Link, useSearchParams } from 'react-router-dom';
import ColorDialog from '@/components/masters/ColorDialog';
import type { Color } from '@/services/mastersService';

const ColorsPage = () => {
  const { data: colors, isLoading } = useColors();
  const deleteColorMutation = useDeleteColor();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const filteredColors = colors?.filter(color =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    color.hex_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="text-center">Loading colors...</div>;
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
            <h1 className="text-3xl font-bold">Colors</h1>
            <p className="text-muted-foreground">Define color variations for your products</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Color
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search colors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredColors.length} of {colors?.length || 0} colors
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                        className="w-8 h-8 rounded-full border border-gray-200"
                        style={{ backgroundColor: color.hex_code }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{color.name}</TableCell>
                    <TableCell className="font-mono text-sm">{color.hex_code}</TableCell>
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
        </CardContent>
      </Card>

      <ColorDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        color={editingColor}
      />
    </div>
  );
};

export default ColorsPage;

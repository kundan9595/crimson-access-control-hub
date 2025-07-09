
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search } from 'lucide-react';
import { useColors, useDeleteColor } from '@/hooks/useMasters';
import ColorDialog from './ColorDialog';
import type { Color } from '@/services/mastersService';

const ColorsList = () => {
  const { data: colors, isLoading } = useColors();
  const deleteColorMutation = useDeleteColor();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search colors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredColors.map((color) => (
          <Card key={color.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex_code }}
                  />
                  <CardTitle className="text-lg">{color.name}</CardTitle>
                </div>
                <Badge variant={color.status === 'active' ? 'default' : 'secondary'}>
                  {color.status}
                </Badge>
              </div>
              <CardDescription>{color.hex_code}</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredColors.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No colors found
        </div>
      )}

      <ColorDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        color={editingColor}
      />
    </div>
  );
};

export default ColorsList;

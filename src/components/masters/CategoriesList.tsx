
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/hooks/useMasters';
import CategoryDialog from './CategoryDialog';
import DraggableList from './shared/DraggableList';
import type { Category } from '@/services/mastersService';

const CategoriesList = () => {
  const { data: categories, isLoading } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();
  const updateCategoryMutation = useUpdateCategory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortEnabled, setSortEnabled] = useState(false);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleReorder = (reorderedCategories: Category[]) => {
    // Update each category with new sort_order
    reorderedCategories.forEach((category, index) => {
      if (category.sort_order !== index + 1) {
        updateCategoryMutation.mutate({
          id: category.id,
          updates: { sort_order: index + 1 }
        });
      }
    });
  };

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort categories by sort_order for consistent display
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    return orderA - orderB;
  });

  const renderCategoryItem = (category: Category, index: number, isDragging: boolean) => (
    <Card className={isDragging ? 'shadow-lg' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {category.image_url && (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-12 h-12 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
            {category.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(category.id)}
            disabled={deleteCategoryMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="text-center">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={sortEnabled ? "default" : "outline"}
          size="sm"
          onClick={() => setSortEnabled(!sortEnabled)}
          disabled={filteredCategories.length <= 1}
        >
          {sortEnabled ? 'Done Sorting' : 'Sort Order'}
        </Button>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No categories found
        </div>
      ) : (
        <DraggableList
          items={sortedCategories}
          onReorder={handleReorder}
          renderItem={renderCategoryItem}
          className="space-y-4"
          disabled={!sortEnabled || searchTerm.length > 0}
        />
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        category={editingCategory}
      />
    </div>
  );
};

export default CategoriesList;


import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Tags, Image as ImageIcon, Eye } from 'lucide-react';
import { useCategories, useDeleteCategory } from '@/hooks/useMasters';
import { useSearchParams } from 'react-router-dom';
import CategoryDialog from '@/components/masters/CategoryDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import CategoryStylesModal from '@/components/masters/CategoryStylesModal';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import type { Category } from '@/services/mastersService';

const CategoriesPage = () => {
  const { data: categories, isLoading } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [viewingCategoryStyles, setViewingCategoryStyles] = useState<Category | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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

  const handleViewStyles = (category: Category) => {
    setViewingCategoryStyles(category);
  };

  const handleStylesModalClose = () => {
    setViewingCategoryStyles(null);
  };

  const handleExport = () => {
    if (!categories || categories.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Sort Order', 'Status', 'Created At'].join(','),
      ...categories.map(category => [
        `"${category.name}"`,
        `"${category.description || ''}"`,
        category.sort_order || 0,
        category.status,
        new Date(category.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort categories by sort_order, then by name
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return <div className="text-center">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Categories"
        description="Organize your products into categories"
        icon={<Tags className="h-6 w-6 text-green-600" />}
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={!!categories?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search categories..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedCategories.length}
            totalCount={categories?.length || 0}
          />
          
          <div className="mt-6">
            {sortedCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="w-10 h-10 relative">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={`${category.name} image`}
                              className="w-full h-full object-cover rounded border bg-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center bg-muted rounded border text-muted-foreground text-xs ${category.image_url ? 'hidden' : ''}`}>
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStyles(category)}
                            title="View Styles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No categories found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        category={editingCategory}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="categories"
        templateHeaders={['Name', 'Description', 'Image URL', 'Sort Order', 'Status']}
        sampleData={[
          ['Electronics', 'Electronic devices and gadgets', 'https://example.com/electronics.jpg', '1', 'active'],
          ['Clothing', 'Apparel and accessories', 'https://example.com/clothing.jpg', '2', 'active']
        ]}
      />

      <CategoryStylesModal
        open={!!viewingCategoryStyles}
        onOpenChange={(open) => {
          if (!open) {
            handleStylesModalClose();
          }
        }}
        category={viewingCategoryStyles}
      />
    </div>
  );
};

export default CategoriesPage;


import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Shirt, Image as ImageIcon, BarChart3, TrendingUp } from 'lucide-react';
import { useClasses, useDeleteClass } from '@/hooks/masters/useClasses';
import { useSearchParams } from 'react-router-dom';
import ClassDialog from '@/components/masters/ClassDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { getSizeRatioDisplay } from '@/utils/stockUtils';
import type { Class } from '@/services/mastersService';

const ClassesPage = () => {
  const { data: classes, isLoading } = useClasses();
  const deleteClassMutation = useDeleteClass();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClassMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClass(null);
  };

  const handleExport = () => {
    if (!classes || classes.length === 0) return;

    const csvContent = [
      ['Name', 'Description', 'Style', 'Color', 'Size Group', 'GST Rate', 'Sort Order', 'Status'].join(','),
      ...classes.map(cls => [
        `"${cls.name}"`,
        `"${cls.description || ''}"`,
        `"${cls.style?.name || ''}"`,
        `"${cls.color?.name || ''}"`,
        `"${cls.size_group?.name || ''}"`,
        cls.gst_rate || 0,
        cls.sort_order || 0,
        cls.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredClasses = classes?.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.style?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.color?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Sort classes by sort_order, then by name
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  if (isLoading) {
    return <div className="text-center">Loading classes...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MasterPageHeader
        title="Classes"
        description="Manage product classes with styles, colors, and images"
        icon={<Shirt className="h-6 w-6 text-pink-600" />}
        onAdd={() => setDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setBulkImportOpen(true)}
        canExport={!!classes?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search classes..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={sortedClasses.length}
            totalCount={classes?.length || 0}
          />
          
          <div className="mt-6">
            {sortedClasses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Style</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="w-20">GST Rate</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClasses.map((classItem) => {
                    const hasStockData = classItem.stock_management_type === 'overall' 
                      ? (classItem.overall_min_stock && classItem.overall_min_stock > 0) || (classItem.overall_max_stock && classItem.overall_max_stock > 0)
                      : classItem.monthly_stock_levels && Object.keys(classItem.monthly_stock_levels).length > 0;
                    const hasRatioData = classItem.size_ratios && Object.keys(classItem.size_ratios).length > 0;
                    
                    return (
                      <TableRow key={classItem.id}>
                        <TableCell>
                          <div className="w-10 h-10 relative">
                            {classItem.primary_image_url ? (
                              <img
                                src={classItem.primary_image_url}
                                alt={`${classItem.name} image`}
                                className="w-full h-full object-cover rounded border bg-muted"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-muted rounded border text-muted-foreground text-xs ${classItem.primary_image_url ? 'hidden' : ''}`}>
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{classItem.name}</div>
                            {classItem.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">{classItem.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{classItem.style?.name || '-'}</TableCell>
                        <TableCell>
                          {classItem.color ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded border border-gray-300" 
                                style={{ backgroundColor: classItem.color.hex_code }}
                              />
                              <span className="text-sm">{classItem.color.name}</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {hasStockData && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <BarChart3 className="h-3 w-3 mr-1" />
                                Stock
                              </Badge>
                            )}
                            {hasRatioData && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Ratios
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{classItem.gst_rate || 0}%</TableCell>
                        <TableCell>
                          <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                            {classItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(classItem)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(classItem.id)}
                              disabled={deleteClassMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No classes found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ClassDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        classItem={editingClass}
      />

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type="classes"
        templateHeaders={['Name', 'Description', 'Style ID', 'Color ID', 'Size Group ID', 'GST Rate', 'Sort Order', 'Status']}
        sampleData={[
          ['Summer T-Shirt Red', 'Red variant of summer t-shirt', 'style-uuid-1', 'color-uuid-1', 'size-group-uuid-1', '18', '1', 'active'],
          ['Winter Jacket Blue', 'Blue winter jacket', 'style-uuid-2', 'color-uuid-2', 'size-group-uuid-2', '12', '2', 'active']
        ]}
      />
    </div>
  );
};

export default ClassesPage;

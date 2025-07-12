import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Trash2, Package, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useClasses, useDeleteClass, useUpdateClass, Class } from '@/hooks/masters';
import ClassDialog from './ClassDialog';
import { getSizeRatioDisplay } from '@/utils/stockUtils';
import DraggableList from './shared/DraggableList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ClassesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortEnabled, setSortEnabled] = useState(false);
  
  const { data: classes = [], isLoading, error } = useClasses();
  const deleteMutation = useDeleteClass();
  const updateMutation = useUpdateClass();

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.style?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.color?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort classes by sort_order for consistent display
  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    return orderA - orderB;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleReorder = (reorderedClasses: Class[]) => {
    // Update each class with new sort_order
    reorderedClasses.forEach((classItem, index) => {
      if (classItem.sort_order !== index + 1) {
        updateMutation.mutate({
          id: classItem.id,
          updates: { sort_order: index + 1 }
        });
      }
    });
  };

  const renderClassItem = (classItem: Class, index: number, isDragging: boolean) => {
    const hasStockData = classItem.stock_management_type === 'overall' 
      ? (classItem.overall_min_stock && classItem.overall_min_stock > 0) || (classItem.overall_max_stock && classItem.overall_max_stock > 0)
      : classItem.monthly_stock_levels && Object.keys(classItem.monthly_stock_levels).length > 0;
    const hasRatioData = classItem.size_ratios && Object.keys(classItem.size_ratios).length > 0;
    
    return (
      <Card className={`hover:shadow-md transition-shadow ${(hasStockData || hasRatioData) ? 'border-l-4 border-l-green-500' : ''} ${isDragging ? 'shadow-lg' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {classItem.name}
                <div className="flex gap-1">
                  {hasStockData && (
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  )}
                  {hasRatioData && (
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                  {classItem.status}
                </Badge>
                {classItem.gst_rate && classItem.gst_rate > 0 && (
                  <Badge variant="outline">
                    GST: {classItem.gst_rate}%
                  </Badge>
                )}
                {hasStockData && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                    <BarChart3 className="h-3 w-3" />
                    {classItem.stock_management_type === 'overall' ? 'Overall Stock' : 'Monthly Stock'}
                  </Badge>
                )}
                {hasRatioData && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    <TrendingUp className="h-3 w-3" />
                    Ratios: {getSizeRatioDisplay(classItem.size_ratios)}
                  </Badge>
                )}
              </div>
            </div>
            {classItem.primary_image_url && (
              <img
                src={classItem.primary_image_url}
                alt={classItem.name}
                className="w-16 h-16 object-cover rounded border ml-3"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {classItem.style && (
              <div>
                <span className="font-medium">Style:</span> {classItem.style.name}
              </div>
            )}
            {classItem.color && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Color:</span>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded border border-gray-300" 
                    style={{ backgroundColor: classItem.color.hex_code }}
                  />
                  {classItem.color.name}
                </div>
              </div>
            )}
            {classItem.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-xs line-clamp-2">{classItem.description}</p>
              </div>
            )}
            {classItem.images && classItem.images.length > 0 && (
              <div>
                <span className="font-medium">Images:</span> {classItem.images.length} additional
              </div>
            )}
            
            {/* Stock Management Display */}
            {hasStockData && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-medium text-green-800 mb-2 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {classItem.stock_management_type === 'overall' ? 'Overall Stock Levels' : 'Monthly Stock Management'}
                </div>
                
                <div className="text-xs">
                  {classItem.stock_management_type === 'overall' ? (
                    <div className="flex justify-between items-center">
                      <span>Min/Max:</span>
                      <span className="font-medium">
                        {classItem.overall_min_stock || 0} - {classItem.overall_max_stock || 0}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span>Monthly levels configured for {Object.keys(classItem.monthly_stock_levels || {}).length} months</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <ClassDialog 
              classItem={classItem}
              trigger={
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Class</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{classItem.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(classItem.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Error loading classes. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button
            variant={sortEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setSortEnabled(!sortEnabled)}
            disabled={filteredClasses.length <= 1}
          >
            {sortEnabled ? 'Done Sorting' : 'Sort Order'}
          </Button>
        </div>
        <ClassDialog />
      </div>

      {sortedClasses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' ? 'No classes match your filters.' : 'No classes found.'}
          </p>
        </div>
      ) : (
        <DraggableList
          items={sortedClasses}
          onReorder={handleReorder}
          renderItem={renderClassItem}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          disabled={!sortEnabled || searchTerm.length > 0 || statusFilter !== 'all'}
        />
      )}
    </div>
  );
};

export default ClassesList;

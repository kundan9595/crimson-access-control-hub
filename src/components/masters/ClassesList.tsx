
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Trash2, Package, Calculator, TrendingUp } from 'lucide-react';
import { useClasses, useDeleteClass, Class } from '@/hooks/masters';
import ClassDialog from './ClassDialog';
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
  
  const { data: classes = [], isLoading, error } = useClasses();
  const deleteMutation = useDeleteClass();

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.style?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.color?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting class:', error);
    }
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
        </div>
        <ClassDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((classItem) => {
          const hasCapacityData = classItem.total_capacity && classItem.capacity_allocation && Object.keys(classItem.capacity_allocation).length > 0;
          const totalAllocated = hasCapacityData ? Object.values(classItem.capacity_allocation).reduce((sum, val) => sum + (val || 0), 0) : 0;
          
          return (
            <Card key={classItem.id} className={`hover:shadow-md transition-shadow ${hasCapacityData ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {classItem.name}
                      {hasCapacityData && (
                        <Calculator className="h-4 w-4 text-blue-600" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                        {classItem.status}
                      </Badge>
                      {classItem.tax_percentage && classItem.tax_percentage > 0 && (
                        <Badge variant="outline">
                          Tax: {classItem.tax_percentage}%
                        </Badge>
                      )}
                      {hasCapacityData && (
                        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
                          <TrendingUp className="h-3 w-3" />
                          Capacity Managed
                        </Badge>
                      )}
                      {classItem.total_capacity && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {classItem.total_capacity} units
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
                  
                  {/* Enhanced Capacity Information Display */}
                  {hasCapacityData && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        Production Capacity Plan
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Capacity:</span>
                          <span className="font-bold text-blue-700">{classItem.total_capacity} units</span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="font-medium">Size Allocation:</span>
                          {Object.entries(classItem.capacity_allocation).map(([sizeId, allocation]) => {
                            const percentage = classItem.size_ratios?.[sizeId] || 0;
                            return (
                              <div key={sizeId} className="flex justify-between items-center pl-2">
                                <span>Size {sizeId.slice(-4)}:</span>
                                <span className="font-medium">
                                  {allocation} units ({percentage}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="pt-1 border-t border-blue-300">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total Allocated:</span>
                            <span className="font-bold text-green-700">{totalAllocated} units</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show size ratios even without full capacity data */}
                  {!hasCapacityData && classItem.size_ratios && Object.keys(classItem.size_ratios).length > 0 && (
                    <div className="p-2 bg-gray-50 rounded border">
                      <span className="font-medium">Size Ratios:</span>
                      <div className="mt-1 text-xs space-y-1">
                        {Object.entries(classItem.size_ratios).map(([sizeId, ratio]) => (
                          <div key={sizeId} className="flex justify-between">
                            <span>Size {sizeId.slice(-4)}:</span>
                            <span>{ratio}%</span>
                          </div>
                        ))}
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
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' ? 'No classes match your filters.' : 'No classes found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassesList;

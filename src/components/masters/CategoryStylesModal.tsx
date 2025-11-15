import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';
import { useStylesByCategory } from '@/hooks/masters/useStyles';
import type { Category, Style } from '@/services/mastersService';

interface CategoryStylesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export const CategoryStylesModal: React.FC<CategoryStylesModalProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: styles = [], isLoading } = useStylesByCategory(category?.id || null);

  const filteredStyles = useMemo(() => {
    if (!searchTerm.trim()) return styles;
    
    const searchLower = searchTerm.toLowerCase();
    return styles.filter((style: Style) =>
      style.name.toLowerCase().includes(searchLower) ||
      style.description?.toLowerCase().includes(searchLower) ||
      style.brand?.name?.toLowerCase().includes(searchLower) ||
      style.status.toLowerCase().includes(searchLower)
    );
  }, [styles, searchTerm]);

  // Sort styles by sort_order
  const sortedStyles = useMemo(() => {
    return [...filteredStyles].sort((a, b) => {
      const orderA = a.sort_order || 0;
      const orderB = b.sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [filteredStyles]);

  const handleClose = () => {
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Styles for {category?.name || 'Category'}
          </DialogTitle>
          <DialogDescription>
            View and search all styles connected to this category
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search styles by name, description, brand, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading styles...'
            ) : (
              <>
                Showing {filteredStyles.length} of {styles.length} style{styles.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            )}
          </div>

          {/* Styles Table */}
          <div className="flex-1 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading styles...
              </div>
            ) : sortedStyles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No styles found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStyles.map((style: Style) => (
                    <TableRow key={style.id}>
                      <TableCell className="font-medium">{style.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {style.description || '-'}
                      </TableCell>
                      <TableCell>
                        {style.brand?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={style.status === 'active' ? 'default' : 'secondary'}
                        >
                          {style.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(style.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryStylesModal;


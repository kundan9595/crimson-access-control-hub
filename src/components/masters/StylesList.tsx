
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useStyles, useDeleteStyle } from '@/hooks/useMasters';
import { Style } from '@/services/mastersService';
import { StyleDialog } from './StyleDialog';

interface StylesListProps {
  searchTerm?: string;
}

export const StylesList: React.FC<StylesListProps> = ({ searchTerm = '' }) => {
  const { data: styles, isLoading, error } = useStyles();
  const deleteMutation = useDeleteStyle();
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [deletingStyle, setDeletingStyle] = useState<Style | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredStyles = useMemo(() => {
    if (!styles || !searchTerm.trim()) return styles || [];
    
    const searchLower = searchTerm.toLowerCase();
    return styles.filter(style =>
      style.name.toLowerCase().includes(searchLower) ||
      style.description?.toLowerCase().includes(searchLower) ||
      style.brand?.name?.toLowerCase().includes(searchLower) ||
      style.category?.name?.toLowerCase().includes(searchLower) ||
      style.status.toLowerCase().includes(searchLower)
    );
  }, [styles, searchTerm]);

  const handleEdit = (style: Style) => {
    setEditingStyle(style);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingStyle) {
      try {
        await deleteMutation.mutateAsync(deletingStyle.id);
        setDeletingStyle(null);
      } catch (error) {
        console.error('Error deleting style:', error);
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingStyle(null);
  };

  if (isLoading) return <div>Loading styles...</div>;
  if (error) return <div>Error loading styles: {error.message}</div>;

  const totalCount = styles?.length || 0;
  const filteredCount = filteredStyles?.length || 0;

  return (
    <>
      <div className="space-y-4">
        {searchTerm && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredCount} of {totalCount} styles
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStyles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No styles found matching your search.' : 'No styles found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStyles?.map((style) => (
                  <TableRow key={style.id}>
                    <TableCell className="font-medium">{style.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {style.description || '-'}
                    </TableCell>
                    <TableCell>
                      {style.brand?.name ? (
                        <Badge variant="outline">
                          {style.brand.name}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {style.category?.name ? (
                        <Badge variant="outline">
                          {style.category.name}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={style.status === 'active' ? 'default' : 'secondary'}>
                        {style.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(style)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingStyle(style)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StyleDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        style={editingStyle}
      />

      <AlertDialog open={!!deletingStyle} onOpenChange={() => setDeletingStyle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the style
              "{deletingStyle?.name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

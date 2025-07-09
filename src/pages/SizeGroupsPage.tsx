import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Ruler, ChevronDown, ChevronRight } from 'lucide-react';
import { useSizeGroups, useDeleteSizeGroup } from '@/hooks/useMasters';
import { SizeGroup } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import SizeGroupWithSizesDialog from '@/components/masters/SizeGroupWithSizesDialog';
import SizeGroupSizes from '@/components/masters/SizeGroupSizes';

const SizeGroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSizeGroup, setEditingSizeGroup] = useState<SizeGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const { data: sizeGroups, isLoading } = useSizeGroups();
  const deleteSizeGroup = useDeleteSizeGroup();

  const filteredSizeGroups = sizeGroups?.filter(sizeGroup =>
    sizeGroup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sizeGroup.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (sizeGroup: SizeGroup) => {
    setEditingSizeGroup(sizeGroup);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this size group?')) {
      deleteSizeGroup.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSizeGroup(null);
    setSearchParams({});
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ruler className="h-8 w-8" />
            Size Groups
          </h1>
          <p className="text-muted-foreground">Manage size groupings and individual sizes</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Size Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Size Groups</CardTitle>
          <CardDescription>Find size groups by name or description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search size groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredSizeGroups?.map((sizeGroup) => (
          <Card key={sizeGroup.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupExpansion(sizeGroup.id)}
                      className="p-1"
                    >
                      {expandedGroups.has(sizeGroup.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <h3 className="text-lg font-semibold">{sizeGroup.name}</h3>
                    <Badge variant={sizeGroup.status === 'active' ? 'default' : 'secondary'}>
                      {sizeGroup.status}
                    </Badge>
                  </div>
                  {sizeGroup.description && (
                    <p className="text-muted-foreground mb-2 ml-10">{sizeGroup.description}</p>
                  )}
                  <div className="text-sm text-muted-foreground ml-10">
                    Created: {new Date(sizeGroup.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(sizeGroup)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sizeGroup.id)}
                    disabled={deleteSizeGroup.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {expandedGroups.has(sizeGroup.id) && (
                <div className="ml-10">
                  <SizeGroupSizes 
                    sizeGroupId={sizeGroup.id}
                    sizeGroupName={sizeGroup.name}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSizeGroups?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Size Groups Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No size groups match your search criteria.' : 'Get started by creating your first size group.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Size Group
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <SizeGroupWithSizesDialog
        sizeGroup={editingSizeGroup}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />
    </div>
  );
};

export default SizeGroupsPage;

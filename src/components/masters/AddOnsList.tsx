import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings } from 'lucide-react';
import { useAddOns, useDeleteAddOn, useCreateAddOn, useUpdateAddOn } from '@/hooks/masters/useAddOns';
import { AddOnDialog } from './AddOnDialog';
import { AddOnOptionsDialog } from './AddOnOptionsDialog';
import { AddOn } from '@/services/masters/addOnsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface AddOnsListProps {
  searchTerm: string;
}

interface AddOnsListRef {
  triggerCreate: () => void;
}

export const AddOnsList = forwardRef<AddOnsListRef, AddOnsListProps>(({ searchTerm }, ref) => {
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [optionsAddOn, setOptionsAddOn] = useState<AddOn | null>(null);

  console.log('🔄 AddOnsList - Render state:', {
    searchTerm,
    selectedAddOn: selectedAddOn?.id || null,
    dialogOpen,
    optionsDialogOpen,
    optionsAddOn: optionsAddOn?.id || null
  });

  const { user, loading: authLoading } = useAuth();
  const { data: addOns = [], isLoading, error } = useAddOns();
  const deleteAddOnMutation = useDeleteAddOn();
  const createAddOnMutation = useCreateAddOn();
  const updateAddOnMutation = useUpdateAddOn();

  const filteredAddOns = addOns.filter(addOn =>
    addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addOn.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    console.log('🚀 AddOnsList - handleCreate called!');
    console.log('🚀 AddOnsList - User check:', user ? 'User exists' : 'No user');
    
    if (!user) {
      console.log('❌ AddOnsList - No user, showing toast and returning');
      toast.error('Please sign in to create add-ons');
      return;
    }
    
    console.log('✅ AddOnsList - Setting selectedAddOn to null');
    setSelectedAddOn(null);
    console.log('✅ AddOnsList - Setting dialogOpen to true');
    setDialogOpen(true);
    console.log('✅ AddOnsList - handleCreate completed, dialogOpen should be true');
  };

  // Expose the create function to parent component
  useImperativeHandle(ref, () => {
    console.log('🔗 AddOnsList - useImperativeHandle creating ref object');
    return {
      triggerCreate: handleCreate
    };
  });

  const handleEdit = (addOn: AddOn) => {
    if (!user) {
      toast.error('Please sign in to edit add-ons');
      return;
    }
    setSelectedAddOn(addOn);
    setDialogOpen(true);
  };

  const handleDelete = async (addOn: AddOn) => {
    if (!user) {
      toast.error('Please sign in to delete add-ons');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${addOn.name}"?`)) {
      deleteAddOnMutation.mutate(addOn.id);
    }
  };

  const handleManageOptions = (addOn: AddOn) => {
    if (!user) {
      toast.error('Please sign in to manage add-on options');
      return;
    }
    setOptionsAddOn(addOn);
    setOptionsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!user) {
      toast.error('Please sign in to save changes');
      return;
    }

    // Ensure options is always an array
    const submitData = {
      ...data,
      options: data.options || []
    };

    if (selectedAddOn) {
      updateAddOnMutation.mutate(
        { id: selectedAddOn.id, data: submitData },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createAddOnMutation.mutate(submitData, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return <div className="text-center py-8">Loading add-ons...</div>;
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Please sign in to manage add-ons</p>
        <p className="text-sm mt-2">You need to be authenticated to create, edit, or delete add-ons.</p>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading add-ons</p>
        <p className="text-sm mt-2">Please try refreshing the page or contact support if the problem persists.</p>
      </div>
    );
  }

  console.log('🎨 AddOnsList - About to render, dialogOpen:', dialogOpen);

  return (
    <>
      {filteredAddOns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No add-ons found</p>
          <p className="text-sm">Click "Add Add On" to create your first add-on entry</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAddOns.map((addOn) => (
            <Card key={addOn.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {addOn.image_url && (
                      <img
                        src={addOn.image_url}
                        alt={addOn.name}
                        className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{addOn.name}</h3>
                        <Badge variant={addOn.status === 'active' ? 'default' : 'secondary'}>
                          {addOn.status}
                        </Badge>
                      </div>
                      {addOn.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {addOn.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Type: {addOn.select_type}</span>
                        <span>Options: {addOn.options?.length || 0}</span>
                        <span>Order: {addOn.display_order || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageOptions(addOn)}
                      disabled={!user}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(addOn)}
                      disabled={!user}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(addOn)}
                      disabled={!user || deleteAddOnMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ErrorBoundary fallback={<div className="text-red-500">Dialog Error: Check console</div>}>
        <AddOnDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          addOn={selectedAddOn}
          isSubmitting={createAddOnMutation.isPending || updateAddOnMutation.isPending}
        />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div className="text-red-500">Options Dialog Error: Check console</div>}>
        <AddOnOptionsDialog
          open={optionsDialogOpen}
          onOpenChange={setOptionsDialogOpen}
          addOn={optionsAddOn}
        />
      </ErrorBoundary>
    </>
  );
});

AddOnsList.displayName = 'AddOnsList';

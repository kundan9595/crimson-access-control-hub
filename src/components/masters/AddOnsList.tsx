
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Settings } from 'lucide-react';
import { useAddOns, useDeleteAddOn, useCreateAddOn, useUpdateAddOn } from '@/hooks/masters/useAddOns';
import { AddOnDialog } from './AddOnDialog';
import { AddOnOptionsDialog } from './AddOnOptionsDialog';
import { MasterEntityCard } from './shared/MasterEntityCard';
import { AddOn } from '@/services/masters/addOnsService';

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

  const { data: addOns = [], isLoading } = useAddOns();
  const deleteAddOnMutation = useDeleteAddOn();
  const createAddOnMutation = useCreateAddOn();
  const updateAddOnMutation = useUpdateAddOn();

  const filteredAddOns = addOns.filter(addOn =>
    addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    addOn.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedAddOn(null);
    setDialogOpen(true);
  };

  // Expose the create function to parent component
  useImperativeHandle(ref, () => ({
    triggerCreate: handleCreate
  }));

  const handleEdit = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setDialogOpen(true);
  };

  const handleDelete = async (addOn: AddOn) => {
    if (window.confirm(`Are you sure you want to delete "${addOn.name}"?`)) {
      deleteAddOnMutation.mutate(addOn.id);
    }
  };

  const handleManageOptions = (addOn: AddOn) => {
    setOptionsAddOn(addOn);
    setOptionsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (selectedAddOn) {
      updateAddOnMutation.mutate(
        { id: selectedAddOn.id, data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createAddOnMutation.mutate(data, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading add-ons...</div>;
  }

  if (filteredAddOns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No add-ons found</p>
        <p className="text-sm">Click "Add Add On" to create your first add-on entry</p>
      </div>
    );
  }

  return (
    <>
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
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(addOn)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(addOn)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddOnDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        addOn={selectedAddOn}
        isSubmitting={createAddOnMutation.isPending || updateAddOnMutation.isPending}
      />

      <AddOnOptionsDialog
        open={optionsDialogOpen}
        onOpenChange={setOptionsDialogOpen}
        addOn={optionsAddOn}
      />
    </>
  );
});

AddOnsList.displayName = 'AddOnsList';

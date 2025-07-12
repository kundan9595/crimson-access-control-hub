
import React, { useState } from 'react';
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

export const AddOnsList: React.FC<AddOnsListProps> = ({ searchTerm }) => {
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
          <MasterEntityCard
            key={addOn.id}
            title={addOn.name}
            description={addOn.description}
            imageUrl={addOn.image_url}
            status={addOn.status}
            metadata={[
              { label: 'Type', value: addOn.select_type },
              { label: 'Options', value: addOn.options?.length || 0 },
              { label: 'Order', value: addOn.display_order || 0 },
            ]}
            actions={[
              {
                label: 'Manage Options',
                icon: Settings,
                onClick: () => handleManageOptions(addOn),
                variant: 'outline',
              },
              {
                label: 'Edit',
                icon: Edit,
                onClick: () => handleEdit(addOn),
                variant: 'outline',
              },
              {
                label: 'Delete',
                icon: Trash2,
                onClick: () => handleDelete(addOn),
                variant: 'outline',
                destructive: true,
              },
            ]}
          />
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
};

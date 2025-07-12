
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAddOnOptions, useDeleteAddOnOption } from '@/hooks/masters/useAddOns';
import { AddOnOptionDialog } from './AddOnOptionDialog';
import { AddOn, AddOnOption } from '@/services/masters/addOnsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AddOnOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addOn: AddOn | null;
}

export const AddOnOptionsDialog: React.FC<AddOnOptionsDialogProps> = ({
  open,
  onOpenChange,
  addOn,
}) => {
  const [selectedOption, setSelectedOption] = useState<AddOnOption | null>(null);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);

  const { user } = useAuth();
  const { data: options = [], isLoading } = useAddOnOptions(addOn?.id);
  const deleteOptionMutation = useDeleteAddOnOption();

  const handleCreateOption = () => {
    if (!user) {
      toast.error('Please sign in to create add-on options');
      return;
    }
    setSelectedOption(null);
    setOptionDialogOpen(true);
  };

  const handleEditOption = (option: AddOnOption) => {
    if (!user) {
      toast.error('Please sign in to edit add-on options');
      return;
    }
    setSelectedOption(option);
    setOptionDialogOpen(true);
  };

  const handleDeleteOption = async (option: AddOnOption) => {
    if (!user) {
      toast.error('Please sign in to delete add-on options');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${option.name}"?`)) {
      deleteOptionMutation.mutate(option.id);
    }
  };

  if (!addOn) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Options: {addOn.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{addOn.select_type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {options.length} option{options.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button onClick={handleCreateOption} disabled={!user}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            {!user && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Please sign in to manage add-on options</p>
              </div>
            )}

            {user && isLoading ? (
              <div className="text-center py-8">Loading options...</div>
            ) : user && options.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No options found</p>
                <p className="text-sm">Click "Add Option" to create the first option</p>
              </div>
            ) : user && (
              <div className="grid gap-3">
                {options.map((option) => (
                  <Card key={option.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            {option.image_url && (
                              <img
                                src={option.image_url}
                                alt={option.name}
                                className="w-12 h-12 object-cover rounded-md border"
                              />
                            )}
                            <div>
                              <h4 className="font-medium truncate">{option.name}</h4>
                              {option.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {option.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {option.price !== undefined && option.price > 0 && (
                                  <Badge variant="outline">₹{option.price}</Badge>
                                )}
                                <Badge variant={option.status === 'active' ? 'default' : 'secondary'}>
                                  {option.status}
                                </Badge>
                                {option.display_order !== undefined && (
                                  <Badge variant="outline">Order: {option.display_order}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOption(option)}
                            disabled={!user}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOption(option)}
                            disabled={!user || deleteOptionMutation.isPending}
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
          </div>
        </DialogContent>
      </Dialog>

      <AddOnOptionDialog
        open={optionDialogOpen}
        onOpenChange={setOptionDialogOpen}
        addOn={addOn}
        option={selectedOption}
      />
    </>
  );
};

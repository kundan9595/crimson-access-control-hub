
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { AddOn, AddOnOption } from '@/services/masters/addOnsService';
import { useUpdateAddOn } from '@/hooks/masters/useAddOns';
import { toast } from 'sonner';

interface AddOnOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addOn: AddOn | null;
}

interface OptionFormData {
  name: string;
  description: string;
  price: string;
  display_order: string;
  image_url: string;
  status: 'active' | 'inactive';
}

export const AddOnOptionsDialog: React.FC<AddOnOptionsDialogProps> = ({
  open,
  onOpenChange,
  addOn,
}) => {
  const [editingOption, setEditingOption] = useState<AddOnOption | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<OptionFormData>({
    name: '',
    description: '',
    price: '',
    display_order: '',
    image_url: '',
    status: 'active',
  });

  const updateAddOnMutation = useUpdateAddOn();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      display_order: '',
      image_url: '',
      status: 'active',
    });
    setEditingOption(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleEdit = (option: AddOnOption) => {
    setEditingOption(option);
    setFormData({
      name: option.name,
      description: option.description || '',
      price: option.price?.toString() || '',
      display_order: option.display_order?.toString() || '',
      image_url: option.image_url || '',
      status: option.status,
    });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!addOn) return;

    try {
      const newOption: AddOnOption = {
        id: editingOption?.id || crypto.randomUUID(),
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        display_order: formData.display_order ? parseInt(formData.display_order) : undefined,
        image_url: formData.image_url || undefined,
        status: formData.status,
      };

      let updatedOptions: AddOnOption[];
      
      if (editingOption) {
        // Update existing option
        updatedOptions = addOn.options.map(opt => 
          opt.id === editingOption.id ? newOption : opt
        );
      } else {
        // Add new option
        updatedOptions = [...addOn.options, newOption];
      }

      await updateAddOnMutation.mutateAsync({
        id: addOn.id,
        data: { options: updatedOptions }
      });

      resetForm();
      toast.success(editingOption ? 'Option updated successfully' : 'Option created successfully');
    } catch (error) {
      console.error('Error saving option:', error);
      toast.error('Failed to save option');
    }
  };

  const handleDelete = async (optionId: string) => {
    if (!addOn) return;

    if (!window.confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      const updatedOptions = addOn.options.filter(opt => opt.id !== optionId);
      
      await updateAddOnMutation.mutateAsync({
        id: addOn.id,
        data: { options: updatedOptions }
      });

      toast.success('Option deleted successfully');
    } catch (error) {
      console.error('Error deleting option:', error);
      toast.error('Failed to delete option');
    }
  };

  if (!addOn) return null;

  const isFormValid = formData.name.trim().length > 0;
  const isEditingOrCreating = editingOption !== null || isCreating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Options for "{addOn.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Option Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Options ({addOn.options.length})</h3>
              <p className="text-sm text-muted-foreground">
                Manage the available options for this add-on
              </p>
            </div>
            <Button onClick={handleCreate} disabled={isEditingOrCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          {/* Create/Edit Form */}
          {isEditingOrCreating && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Option name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Option description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Display Order</label>
                      <Input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={!isFormValid || updateAddOnMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingOption ? 'Update' : 'Create'}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options List */}
          <div className="space-y-3">
            {addOn.options.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No options found</p>
                <p className="text-sm">Click "Add Option" to create your first option</p>
              </div>
            ) : (
              addOn.options.map((option) => (
                <Card key={option.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{option.name}</h4>
                          <Badge variant={option.status === 'active' ? 'default' : 'secondary'}>
                            {option.status}
                          </Badge>
                          {option.price && (
                            <Badge variant="outline">
                              ${option.price.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {option.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Order: {option.display_order || 0}</span>
                          {option.image_url && <span>Has Image</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(option)}
                          disabled={isEditingOrCreating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(option.id)}
                          disabled={updateAddOnMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

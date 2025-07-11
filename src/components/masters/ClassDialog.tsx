
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, X } from 'lucide-react';
import { useCreateClass, useUpdateClass, useStyles, useColors, useSizeGroups, useSizes, Class } from '@/hooks/masters';
import ImageUpload from '@/components/ui/ImageUpload';
import { calculateCapacityAllocation, validateSizeRatios, getTotalRatioPercentage } from '@/utils/capacityUtils';

interface ClassDialogProps {
  classItem?: Class;
  trigger?: React.ReactNode;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ classItem, trigger }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    style_id: null as string | null,
    color_id: null as string | null,
    size_group_id: null as string | null,
    selected_sizes: [] as string[],
    description: '',
    status: 'active' as string,
    tax_percentage: 0,
    primary_image_url: '',
    images: [] as string[],
    total_capacity: null as number | null,
    size_ratios: {} as Record<string, number>,
    capacity_allocation: {} as Record<string, number>,
  });

  const { data: styles = [] } = useStyles();
  const { data: colors = [] } = useColors();
  const { data: sizeGroups = [] } = useSizeGroups();
  const { data: allSizes = [] } = useSizes();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  // Filter sizes based on selected size group
  const availableSizes = formData.size_group_id 
    ? allSizes.filter(size => size.size_group_id === formData.size_group_id && size.status === 'active')
    : [];

  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name,
        style_id: classItem.style_id,
        color_id: classItem.color_id,
        size_group_id: classItem.size_group_id,
        selected_sizes: Array.isArray(classItem.selected_sizes) ? classItem.selected_sizes : [],
        description: classItem.description || '',
        status: classItem.status,
        tax_percentage: classItem.tax_percentage || 0,
        primary_image_url: classItem.primary_image_url || '',
        images: Array.isArray(classItem.images) ? classItem.images : [],
        total_capacity: classItem.total_capacity,
        size_ratios: classItem.size_ratios || {},
        capacity_allocation: classItem.capacity_allocation || {},
      });
    }
  }, [classItem]);

  // Update capacity allocation when total capacity or size ratios change
  useEffect(() => {
    if (formData.total_capacity && Object.keys(formData.size_ratios).length > 0) {
      const allocation = calculateCapacityAllocation(formData.total_capacity, formData.size_ratios);
      setFormData(prev => ({ ...prev, capacity_allocation: allocation }));
    }
  }, [formData.total_capacity, formData.size_ratios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name,
      style_id: formData.style_id,
      color_id: formData.color_id,
      size_group_id: formData.size_group_id,
      selected_sizes: formData.selected_sizes.length > 0 ? formData.selected_sizes : null,
      description: formData.description || null,
      status: formData.status,
      tax_percentage: formData.tax_percentage || null,
      primary_image_url: formData.primary_image_url || null,
      images: formData.images.length > 0 ? formData.images : null,
      total_capacity: formData.total_capacity,
      size_ratios: Object.keys(formData.size_ratios).length > 0 ? formData.size_ratios : null,
      capacity_allocation: Object.keys(formData.capacity_allocation).length > 0 ? formData.capacity_allocation : null,
    };

    try {
      if (classItem) {
        await updateMutation.mutateAsync({ id: classItem.id, updates: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      style_id: null,
      color_id: null,
      size_group_id: null,
      selected_sizes: [],
      description: '',
      status: 'active',
      tax_percentage: 0,
      primary_image_url: '',
      images: [],
      total_capacity: null,
      size_ratios: {},
      capacity_allocation: {},
    });
  };

  const handleClose = () => {
    setOpen(false);
    if (!classItem) resetForm();
  };

  const handleSizeGroupChange = (value: string) => {
    const newValue = value === 'none' ? null : value;
    setFormData(prev => ({
      ...prev,
      size_group_id: newValue,
      selected_sizes: [], // Clear selected sizes when group changes
      size_ratios: {}, // Clear size ratios when group changes
      capacity_allocation: {} // Clear capacity allocation when group changes
    }));
  };

  const toggleSizeSelection = (sizeId: string) => {
    setFormData(prev => {
      const newSelectedSizes = prev.selected_sizes.includes(sizeId)
        ? prev.selected_sizes.filter(id => id !== sizeId)
        : [...prev.selected_sizes, sizeId];
      
      // Remove ratio for unselected sizes
      const newSizeRatios = { ...prev.size_ratios };
      if (!newSelectedSizes.includes(sizeId)) {
        delete newSizeRatios[sizeId];
      }
      
      return {
        ...prev,
        selected_sizes: newSelectedSizes,
        size_ratios: newSizeRatios
      };
    });
  };

  const updateSizeRatio = (sizeId: string, ratio: number) => {
    setFormData(prev => ({
      ...prev,
      size_ratios: {
        ...prev.size_ratios,
        [sizeId]: ratio
      }
    }));
  };

  const addImage = (url: string) => {
    if (url && !formData.images.includes(url)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      primary_image_url: url
    }));
  };

  const totalRatioPercentage = getTotalRatioPercentage(formData.size_ratios);
  const isRatioValid = validateSizeRatios(formData.size_ratios);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger || (
          <Button>
            {classItem ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {classItem ? 'Edit' : 'Add Class'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{classItem ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Style</Label>
                <Select value={formData.style_id || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, style_id: value === 'none' ? null : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Style</SelectItem>
                    {styles.filter(style => style.status === 'active').map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color_id || 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, color_id: value === 'none' ? null : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Color</SelectItem>
                    {colors.filter(color => color.status === 'active').map((color) => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300" 
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="sizeGroup">Size Group</Label>
              <Select value={formData.size_group_id || 'none'} onValueChange={handleSizeGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Size Group</SelectItem>
                  {sizeGroups.filter(group => group.status === 'active').map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.size_group_id && availableSizes.length > 0 && (
              <div>
                <Label>Available Sizes</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                  {availableSizes.map((size) => (
                    <div key={size.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`size-${size.id}`}
                        checked={formData.selected_sizes.includes(size.id)}
                        onChange={() => toggleSizeSelection(size.id)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`size-${size.id}`} className="text-sm">
                        {size.name} ({size.code})
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.selected_sizes.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-sm text-muted-foreground">
                      Selected: {formData.selected_sizes.length} size(s)
                    </Label>
                  </div>
                )}
              </div>
            )}

            {/* Capacity Management Section */}
            {formData.selected_sizes.length > 0 && (
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">Capacity Management</h3>
                
                <div>
                  <Label htmlFor="total_capacity">Total Production Capacity</Label>
                  <Input
                    id="total_capacity"
                    type="number"
                    min="0"
                    value={formData.total_capacity || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      total_capacity: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    placeholder="Enter total capacity"
                  />
                </div>

                <div>
                  <Label>Size Distribution Ratios (%)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {availableSizes
                      .filter(size => formData.selected_sizes.includes(size.id))
                      .map((size) => (
                        <div key={size.id} className="flex items-center space-x-2">
                          <Label className="w-16 text-sm">{size.code}:</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.size_ratios[size.id] || ''}
                            onChange={(e) => updateSizeRatio(size.id, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      ))}
                  </div>
                  
                  <div className="mt-2 flex justify-between text-sm">
                    <span className={`${totalRatioPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      Total: {totalRatioPercentage}%
                    </span>
                    {totalRatioPercentage !== 100 && (
                      <span className="text-orange-600">
                        Should equal 100%
                      </span>
                    )}
                  </div>
                </div>

                {/* Capacity Allocation Display */}
                {formData.total_capacity && Object.keys(formData.capacity_allocation).length > 0 && (
                  <div>
                    <Label>Calculated Capacity Allocation</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-gray-50 rounded">
                      {availableSizes
                        .filter(size => formData.selected_sizes.includes(size.id))
                        .map((size) => (
                          <div key={size.id} className="flex justify-between text-sm">
                            <span>{size.code}:</span>
                            <span className="font-medium">
                              {formData.capacity_allocation[size.id] || 0} units
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
              <Input
                id="tax_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Primary Image</Label>
              <ImageUpload
                value={formData.primary_image_url}
                onChange={setPrimaryImage}
                onRemove={() => setPrimaryImage('')}
                placeholder="Upload primary image"
              />
            </div>

            <div>
              <Label>Additional Images</Label>
              <ImageUpload
                value=""
                onChange={addImage}
                onRemove={() => {}}
                placeholder="Upload additional images"
              />
              
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === 'active'}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
              />
              <Label htmlFor="status">Active</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDialog;

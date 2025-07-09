
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2 } from 'lucide-react';
import { useCreateClass, useUpdateClass, useStyles, useColors, Class } from '@/hooks/masters';
import ImageUpload from '@/components/ui/ImageUpload';

interface ClassDialogProps {
  classItem?: Class;
  trigger?: React.ReactNode;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ classItem, trigger }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    style_id: 'none',
    color_id: 'none',
    description: '',
    status: 'active' as 'active' | 'inactive',
    tax_percentage: 0,
    primary_image_url: '',
    images: [] as string[],
  });

  const { data: styles = [] } = useStyles();
  const { data: colors = [] } = useColors();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name,
        style_id: classItem.style_id || 'none',
        color_id: classItem.color_id || 'none',
        description: classItem.description || '',
        status: classItem.status,
        tax_percentage: classItem.tax_percentage || 0,
        primary_image_url: classItem.primary_image_url || '',
        images: Array.isArray(classItem.images) ? classItem.images : [],
      });
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      style_id: formData.style_id === 'none' ? null : formData.style_id,
      color_id: formData.color_id === 'none' ? null : formData.color_id,
      description: formData.description || null,
      tax_percentage: formData.tax_percentage || null,
      primary_image_url: formData.primary_image_url || null,
      images: formData.images.length > 0 ? formData.images : null,
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
      style_id: 'none',
      color_id: 'none',
      description: '',
      status: 'active',
      tax_percentage: 0,
      primary_image_url: '',
      images: [],
    });
  };

  const handleClose = () => {
    setOpen(false);
    if (!classItem) resetForm();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Select value={formData.style_id} onValueChange={(value) => setFormData(prev => ({ ...prev, style_id: value }))}>
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
                <Select value={formData.color_id} onValueChange={(value) => setFormData(prev => ({ ...prev, color_id: value }))}>
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
                        ×
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

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, X, AlertTriangle, CheckCircle, Package, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useCreateClass, useUpdateClass, useStyles, useColors, useSizeGroups, useSizes, Class } from '@/hooks/masters';
import ImageUpload from '@/components/ui/ImageUpload';
import MultipleImageUpload from '@/components/ui/MultipleImageUpload';
import { validateSizeRatios, getSizeRatioDisplay, getDefaultMonthlyStockLevels, validateMonthlyStockLevels, StockLevelsByMonth } from '@/utils/stockUtils';

interface ClassDialogProps {
  classItem?: Class;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ classItem, trigger, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    style_id: null as string | null,
    color_id: null as string | null,
    size_group_id: null as string | null,
    selected_sizes: [] as string[],
    description: '',
    status: 'active' as string,
    gst_rate: 0,
    sort_order: 0,
    primary_image_url: '',
    images: [] as string[],
    size_ratios: {} as Record<string, number>,
    stock_management_type: 'overall' as 'overall' | 'monthly',
    overall_min_stock: 0,
    overall_max_stock: 0,
    monthly_stock_levels: {} as StockLevelsByMonth,
  });

  const { data: styles = [] } = useStyles();
  const { data: colors = [] } = useColors();
  const { data: sizeGroups = [] } = useSizeGroups();
  const { data: allSizes = [] } = useSizes();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Filter sizes based on selected size group
  const availableSizes = formData.size_group_id 
    ? allSizes.filter(size => size.size_group_id === formData.size_group_id && size.status === 'active')
    : [];

  const resetForm = () => {
    setFormData({
      name: '',
      style_id: null,
      color_id: null,
      size_group_id: null,
      selected_sizes: [],
      description: '',
      status: 'active',
      gst_rate: 0,
      sort_order: 0,
      primary_image_url: '',
      images: [],
      size_ratios: {},
      stock_management_type: 'overall',
      overall_min_stock: 0,
      overall_max_stock: 0,
      monthly_stock_levels: {},
    });
  };

  // Reset form when dialog opens and there's no classItem (add mode)
  useEffect(() => {
    if (isOpen && !classItem) {
      // Dialog opened in add mode - resetting form
      resetForm();
    }
  }, [isOpen, classItem]);

  useEffect(() => {
    if (classItem) {
      // Loading class item for editing
      setFormData({
        name: classItem.name,
        style_id: classItem.style_id,
        color_id: classItem.color_id,
        size_group_id: classItem.size_group_id,
        selected_sizes: Array.isArray(classItem.selected_sizes) ? classItem.selected_sizes : [],
        description: classItem.description || '',
        status: classItem.status,
        gst_rate: classItem.gst_rate || 0,
        sort_order: classItem.sort_order || 0,
        primary_image_url: classItem.primary_image_url || '',
        images: Array.isArray(classItem.images) ? classItem.images : [],
        size_ratios: classItem.size_ratios || {},
        stock_management_type: (classItem.stock_management_type as 'overall' | 'monthly') || 'overall',
        overall_min_stock: classItem.overall_min_stock || 0,
        overall_max_stock: classItem.overall_max_stock || 0,
        monthly_stock_levels: classItem.monthly_stock_levels || {},
      });
    } else if (isOpen) {
      // Explicitly reset when no classItem and dialog is open
      // No class item and dialog is open - resetting form
      resetForm();
    }
  }, [classItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submitting class data
    
    const submitData = {
      name: formData.name,
      style_id: formData.style_id,
      color_id: formData.color_id,
      size_group_id: formData.size_group_id,
      selected_sizes: formData.selected_sizes.length > 0 ? formData.selected_sizes : null,
      description: formData.description || null,
      status: formData.status,
      gst_rate: formData.gst_rate || null,
      sort_order: formData.sort_order || null,
      primary_image_url: formData.primary_image_url || null,
      images: formData.images.length > 0 ? formData.images : null,
      size_ratios: Object.keys(formData.size_ratios).length > 0 ? formData.size_ratios : null,
      stock_management_type: formData.stock_management_type,
      overall_min_stock: formData.stock_management_type === 'overall' ? formData.overall_min_stock : null,
      overall_max_stock: formData.stock_management_type === 'overall' ? formData.overall_max_stock : null,
      monthly_stock_levels: formData.stock_management_type === 'monthly' && Object.keys(formData.monthly_stock_levels).length > 0 ? formData.monthly_stock_levels : null,
    };

    try {
      if (classItem) {
        await updateMutation.mutateAsync({ id: classItem.id, updates: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSizeGroupChange = (value: string) => {
    const newValue = value === 'none' ? null : value;
    // Size group changed
    setFormData(prev => ({
      ...prev,
      size_group_id: newValue,
      selected_sizes: [], // Clear selected sizes when group changes
      size_ratios: {}, // Clear size ratios when group changes
    }));
  };

  const toggleSizeSelection = (sizeId: string) => {
    // Toggling size selection
    setFormData(prev => {
      const newSelectedSizes = prev.selected_sizes.includes(sizeId)
        ? prev.selected_sizes.filter(id => id !== sizeId)
        : [...prev.selected_sizes, sizeId];
      
      // Remove ratio for unselected sizes
      const newSizeRatios = { ...prev.size_ratios };
      if (!newSelectedSizes.includes(sizeId)) {
        delete newSizeRatios[sizeId];
      }
      
      // Updated selected sizes
      return {
        ...prev,
        selected_sizes: newSelectedSizes,
        size_ratios: newSizeRatios,
      };
    });
  };

  const updateSizeRatio = (sizeId: string, ratio: number) => {
    // Updating size ratio
    setFormData(prev => ({
      ...prev,
      size_ratios: {
        ...prev.size_ratios,
        [sizeId]: ratio
      }
    }));
  };

  const handleStockManagementTypeChange = (type: 'overall' | 'monthly') => {
    setFormData(prev => ({
      ...prev,
      stock_management_type: type,
      monthly_stock_levels: type === 'monthly' && Object.keys(prev.monthly_stock_levels).length === 0 
        ? getDefaultMonthlyStockLevels() 
        : prev.monthly_stock_levels
    }));
  };

  const updateMonthlyStock = (month: number, field: 'minStock' | 'maxStock', value: number) => {
    setFormData(prev => ({
      ...prev,
      monthly_stock_levels: {
        ...prev.monthly_stock_levels,
        [month.toString()]: {
          ...prev.monthly_stock_levels[month.toString()],
          [field]: value
        }
      }
    }));
  };

  const addImages = (urls: string[]) => {
    const newImages = urls.filter(url => url && !formData.images.includes(url));
    if (newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
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

  const isRatioValid = validateSizeRatios(formData.size_ratios);
  const hasRatioData = Object.keys(formData.size_ratios).length > 0;
  const hasStockData = formData.stock_management_type === 'overall' 
    ? (formData.overall_min_stock > 0 || formData.overall_max_stock > 0)
    : Object.keys(formData.monthly_stock_levels).length > 0;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {classItem ? 'Edit Class' : 'Add New Class'}
            {(hasStockData || hasRatioData) && (
              <div className="flex gap-1">
                {hasStockData && <BarChart3 className="h-5 w-5 text-green-600" />}
                {hasRatioData && <TrendingUp className="h-5 w-5 text-blue-600" />}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sizes">Sizes & Ratios</TabsTrigger>
              <TabsTrigger value="stock">Stock Management</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gst_rate">GST Rate (%)</Label>
                      <Input
                        id="gst_rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.gst_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sort_order">Sort Order</Label>
                      <Input
                        id="sort_order"
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={formData.status === 'active'}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                    />
                    <Label htmlFor="status">Active</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sizes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Size Management & Ratios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto bg-gray-50">
                        {availableSizes.map((size) => (
                          <div key={size.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`size-${size.id}`}
                              checked={formData.selected_sizes.includes(size.id)}
                              onChange={() => toggleSizeSelection(size.id)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`size-${size.id}`} className="text-sm font-medium">
                              {size.name} ({size.code})
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.selected_sizes.length > 0 && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Selected: {formData.selected_sizes.length} size(s)
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {formData.selected_sizes.length > 0 && (
                    <div className="border-t pt-4">
                      <Label className="text-base font-semibold">Size Distribution Ratios</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Set simple ratio numbers for each size (e.g., 1:2:3 means size A gets 1 part, size B gets 2 parts, size C gets 3 parts).
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {availableSizes
                          .filter(size => formData.selected_sizes.includes(size.id))
                          .map((size) => (
                            <div key={size.id} className="flex items-center space-x-3 p-3 bg-white rounded border">
                              <Label className="w-20 text-sm font-medium">{size.code}:</Label>
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={formData.size_ratios[size.id] || ''}
                                onChange={(e) => updateSizeRatio(size.id, parseInt(e.target.value) || 0)}
                                placeholder="1"
                                className="flex-1"
                              />
                            </div>
                          ))}
                      </div>
                      
                      {!isRatioValid && hasRatioData && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            All ratio values must be positive numbers.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <BarChart3 className="h-5 w-5" />
                    Stock Level Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Stock Management Type</Label>
                    <Select value={formData.stock_management_type} onValueChange={handleStockManagementTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overall">Overall Min/Max Stock</SelectItem>
                        <SelectItem value="monthly">Monthly Min/Max Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.stock_management_type === 'overall' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="overall_min_stock">Minimum Stock Level</Label>
                        <Input
                          id="overall_min_stock"
                          type="number"
                          min="0"
                          value={formData.overall_min_stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, overall_min_stock: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="overall_max_stock">Maximum Stock Level</Label>
                        <Input
                          id="overall_max_stock"
                          type="number"
                          min="0"
                          value={formData.overall_max_stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, overall_max_stock: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  )}

                  {formData.stock_management_type === 'monthly' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthNames.map((monthName, index) => {
                          const month = index + 1;
                          const stockLevel = formData.monthly_stock_levels[month.toString()] || { minStock: 0, maxStock: 0 };
                          
                          return (
                            <div key={month} className="border rounded p-3 bg-white">
                              <Label className="text-sm font-medium mb-2 block">{monthName}</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Min Stock</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={stockLevel.minStock || 0}
                                    onChange={(e) => updateMonthlyStock(month, 'minStock', parseInt(e.target.value) || 0)}
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Max Stock</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={stockLevel.maxStock || 0}
                                    onChange={(e) => updateMonthlyStock(month, 'maxStock', parseInt(e.target.value) || 0)}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <MultipleImageUpload
                      onImagesUploaded={addImages}
                      placeholder="Upload additional images"
                      maxFiles={10}
                      maxSize={5}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="min-w-24"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDialog;

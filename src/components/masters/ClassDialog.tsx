
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
import { Plus, Edit2, X, AlertTriangle, CheckCircle, Package, TrendingUp, Calendar } from 'lucide-react';
import { useCreateClass, useUpdateClass, useStyles, useColors, useSizeGroups, useSizes, Class } from '@/hooks/masters';
import ImageUpload from '@/components/ui/ImageUpload';
import { validateSizeRatios, getTotalRatioPercentage, getDefaultStockLevels, validateMonthlyStockLevels, StockLevelsBySize } from '@/utils/stockUtils';

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
    size_ratios: {} as Record<string, number>,
    monthly_stock_levels: {} as StockLevelsBySize,
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
      console.log('Loading class item for editing:', classItem);
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
        size_ratios: classItem.size_ratios || {},
        monthly_stock_levels: classItem.monthly_stock_levels || {},
      });
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting class data:', formData);
    
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
      size_ratios: Object.keys(formData.size_ratios).length > 0 ? formData.size_ratios : null,
      monthly_stock_levels: Object.keys(formData.monthly_stock_levels).length > 0 ? formData.monthly_stock_levels : null,
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
      size_ratios: {},
      monthly_stock_levels: {},
    });
  };

  const handleClose = () => {
    setOpen(false);
    if (!classItem) resetForm();
  };

  const handleSizeGroupChange = (value: string) => {
    const newValue = value === 'none' ? null : value;
    console.log('Size group changed:', newValue);
    setFormData(prev => ({
      ...prev,
      size_group_id: newValue,
      selected_sizes: [], // Clear selected sizes when group changes
      size_ratios: {}, // Clear size ratios when group changes
      monthly_stock_levels: {} // Clear stock levels when group changes
    }));
  };

  const toggleSizeSelection = (sizeId: string) => {
    console.log('Toggling size selection:', sizeId);
    setFormData(prev => {
      const newSelectedSizes = prev.selected_sizes.includes(sizeId)
        ? prev.selected_sizes.filter(id => id !== sizeId)
        : [...prev.selected_sizes, sizeId];
      
      // Remove ratio and stock levels for unselected sizes
      const newSizeRatios = { ...prev.size_ratios };
      const newStockLevels = { ...prev.monthly_stock_levels };
      
      if (!newSelectedSizes.includes(sizeId)) {
        delete newSizeRatios[sizeId];
        delete newStockLevels[sizeId];
      } else {
        // Initialize stock levels for newly selected size
        if (!newStockLevels[sizeId]) {
          const currentYear = new Date().getFullYear();
          newStockLevels[sizeId] = Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            year: currentYear,
            minStock: 0,
            maxStock: 0,
          }));
        }
      }
      
      console.log('Updated selected sizes:', newSelectedSizes);
      return {
        ...prev,
        selected_sizes: newSelectedSizes,
        size_ratios: newSizeRatios,
        monthly_stock_levels: newStockLevels
      };
    });
  };

  const updateSizeRatio = (sizeId: string, ratio: number) => {
    console.log('Updating size ratio:', sizeId, ratio);
    setFormData(prev => ({
      ...prev,
      size_ratios: {
        ...prev.size_ratios,
        [sizeId]: ratio
      }
    }));
  };

  const updateStockLevel = (sizeId: string, month: number, field: 'minStock' | 'maxStock', value: number) => {
    setFormData(prev => ({
      ...prev,
      monthly_stock_levels: {
        ...prev.monthly_stock_levels,
        [sizeId]: prev.monthly_stock_levels[sizeId]?.map(level => 
          level.month === month 
            ? { ...level, [field]: value }
            : level
        ) || []
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
  const hasStockData = Object.keys(formData.monthly_stock_levels).length > 0;
  const hasRatioData = Object.keys(formData.size_ratios).length > 0;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {classItem ? 'Edit Class' : 'Add New Class'}
            {(hasStockData || hasRatioData) && (
              <div className="flex gap-1">
                {hasStockData && <Calendar className="h-5 w-5 text-green-600" />}
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
                      <Label className="text-base font-semibold">Size Distribution Ratios (%)</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Set the percentage split for each size. Total should equal 100%.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {availableSizes
                          .filter(size => formData.selected_sizes.includes(size.id))
                          .map((size) => (
                            <div key={size.id} className="flex items-center space-x-3 p-3 bg-white rounded border">
                              <Label className="w-20 text-sm font-medium">{size.code}:</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.size_ratios[size.id] || ''}
                                onChange={(e) => updateSizeRatio(size.id, parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground w-8">%</span>
                            </div>
                          ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-white rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Percentage:</span>
                          <span className={`text-lg font-bold ${
                            totalRatioPercentage === 100 
                              ? 'text-green-600' 
                              : totalRatioPercentage > 100 
                                ? 'text-red-600' 
                                : 'text-orange-600'
                          }`}>
                            {totalRatioPercentage}%
                          </span>
                        </div>
                        {totalRatioPercentage !== 100 && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {totalRatioPercentage > 100 
                                ? 'Total percentage exceeds 100%. Please adjust the ratios.'
                                : `You need ${100 - totalRatioPercentage}% more to reach 100%.`
                              }
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4">
              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                    <Calendar className="h-5 w-5" />
                    Monthly Stock Level Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.selected_sizes.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please select sizes in the "Sizes & Ratios" tab to manage stock levels.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      {availableSizes
                        .filter(size => formData.selected_sizes.includes(size.id))
                        .map((size) => (
                          <div key={size.id} className="border rounded-lg p-4 bg-white">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {size.name} ({size.code}) - Monthly Stock Levels
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {monthNames.map((monthName, index) => {
                                const month = index + 1;
                                const stockLevel = formData.monthly_stock_levels[size.id]?.find(level => level.month === month);
                                
                                return (
                                  <div key={month} className="border rounded p-3 bg-gray-50">
                                    <Label className="text-sm font-medium mb-2 block">{monthName}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Min Stock</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={stockLevel?.minStock || 0}
                                          onChange={(e) => updateStockLevel(size.id, month, 'minStock', parseInt(e.target.value) || 0)}
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Max Stock</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={stockLevel?.maxStock || 0}
                                          onChange={(e) => updateStockLevel(size.id, month, 'maxStock', parseInt(e.target.value) || 0)}
                                          className="text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
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

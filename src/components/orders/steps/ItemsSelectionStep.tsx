import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Search, 
  Package,
  ShoppingCart,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePriceTypes } from '@/hooks/masters/usePriceTypes';
import type { OrderFormData, OrderItemFormData, SKU, Class, PriceType } from '@/services/orders/types';

interface ItemsSelectionStepProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

interface Size {
  id: string;
  name: string;
  code: string;
}

export const ItemsSelectionStep: React.FC<ItemsSelectionStepProps> = ({
  formData,
  updateFormData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [skuSearchResults, setSkuSearchResults] = useState<SKU[]>([]);
  const [classSearchResults, setClassSearchResults] = useState<Class[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState('skus');
  const [loading, setLoading] = useState(false);
  const [editingMiscItemId, setEditingMiscItemId] = useState<string | null>(null);

  const { data: priceTypes = [] } = usePriceTypes();

  // Search for SKUs and Classes
  useEffect(() => {
    const searchItems = async () => {
      if (searchTerm.length < 2) {
        setSkuSearchResults([]);
        setClassSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search SKUs
        const { data: skusData, error: skusError } = await supabase
          .from('skus')
          .select(`
            id,
            sku_code,
            description,
            base_mrp,
            cost_price,
            price_type_prices,
            status,
            class:classes(
              id,
              name,
              description,
              primary_image_url,
              style:styles(
                id,
                name,
                brand:brands(id, name),
                category:categories(id, name)
              ),
              color:colors(id, name, hex_code)
            ),
            size:sizes(id, name, code)
          `)
          .ilike('sku_code', `%${searchTerm}%`)
          .eq('status', 'active')
          .limit(20);

        if (skusError) {
          console.error('Error searching SKUs:', skusError);
        } else {
          setSkuSearchResults((skusData || []) as SKU[]);
        }

        // Search Classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            description,
            primary_image_url,
            status,
            style:styles(
              id,
              name,
              brand:brands(id, name),
              category:categories(id, name)
            ),
            color:colors(id, name, hex_code)
          `)
          .ilike('name', `%${searchTerm}%`)
          .eq('status', 'active')
          .limit(20);

        if (classesError) {
          console.error('Error searching Classes:', classesError);
        } else {
          setClassSearchResults((classesData || []) as Class[]);
        }
      } catch (error) {
        console.error('Error searching items:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSkuSelect = async (sku: SKU) => {
    // Check if SKU already exists
    const existingItem = formData.items.find(item => 
      item.item_type === 'sku' && item.sku_id === sku.id
    );
    
    if (existingItem) {
      toast.error(`SKU "${sku.sku_code}" is already in the order`);
      return;
    }
    
    // Use order-level price type as default, or undefined for base MRP
    const defaultPriceTypeId = formData.price_type_id;
    
    // Calculate price based on price type
    let unitPrice = sku.base_mrp || 0;
    if (defaultPriceTypeId && sku.price_type_prices && sku.price_type_prices[defaultPriceTypeId]) {
      unitPrice = sku.price_type_prices[defaultPriceTypeId];
    }
    
    const newItem: OrderItemFormData = {
      id: `sku-${sku.id}-${Date.now()}`,
      item_type: 'sku',
      sku_id: sku.id,
      size_id: sku.size?.id,
      quantity: 1,
      price_type_id: defaultPriceTypeId,
      unit_price: unitPrice,
      discount_percentage: 0,
      subtotal: unitPrice,
      sku: sku,
      size: sku.size
    };
    
    updateFormData({
      items: [...formData.items, newItem]
    });
    
    setSearchTerm('');
    setShowSearch(false);
    toast.success(`Added SKU: ${sku.sku_code}`);
  };

  const handleClassSelect = async (classItem: Class) => {
    // Get all SKUs for this class
    try {
      const { data: skusData, error } = await supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          description,
          base_mrp,
          cost_price,
          price_type_prices,
          status,
          size:sizes(id, name, code)
        `)
        .eq('class_id', classItem.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching class SKUs:', error);
        toast.error('Failed to load class SKUs');
        return;
      }

      if (!skusData || skusData.length === 0) {
        toast.error(`Class "${classItem.name}" has no available SKUs`);
        return;
      }

      // Filter out already added SKUs
      const existingSkuIds = new Set(
        formData.items
          .filter(item => item.item_type === 'sku')
          .map(item => item.sku_id)
      );
      
      const newSkus = skusData.filter(sku => !existingSkuIds.has(sku.id));
      
      if (newSkus.length === 0) {
        toast.error(`All SKUs from class "${classItem.name}" are already in the order`);
        return;
      }

      // Add all new SKUs from the class
      const defaultPriceTypeId = formData.price_type_id;
      const newItems: OrderItemFormData[] = newSkus.map(sku => {
        // Calculate price based on price type
        let unitPrice = sku.base_mrp || 0;
        if (defaultPriceTypeId && sku.price_type_prices && sku.price_type_prices[defaultPriceTypeId]) {
          unitPrice = sku.price_type_prices[defaultPriceTypeId];
        }
        
        return {
          id: `sku-${sku.id}-${Date.now()}`,
          item_type: 'sku',
          sku_id: sku.id,
          size_id: sku.size?.id,
          quantity: 1,
          price_type_id: defaultPriceTypeId,
          unit_price: unitPrice,
          discount_percentage: 0,
          subtotal: unitPrice,
          sku: {
            ...sku,
            class: classItem
          } as SKU,
          size: sku.size
        };
      });

      updateFormData({
        items: [...formData.items, ...newItems]
      });

      setSearchTerm('');
      setShowSearch(false);
      toast.success(`Added ${newItems.length} SKUs from class "${classItem.name}"`);
    } catch (error) {
      console.error('Error adding class SKUs:', error);
      toast.error('Failed to add class SKUs');
    }
  };

  const handleAddMiscItem = () => {
    const newItem: OrderItemFormData = {
      id: `misc-${Date.now()}-${Math.random()}`,
      item_type: 'misc',
      misc_name: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      subtotal: 0
    };

    updateFormData({
      items: [...formData.items, newItem]
    });
    setEditingMiscItemId(newItem.id);
  };

  const handleRemoveItem = (itemId: string) => {
    updateFormData({
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<OrderItemFormData>) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate subtotal
        const itemSubtotal = updatedItem.quantity * updatedItem.unit_price;
        const discountAmount = (itemSubtotal * updatedItem.discount_percentage) / 100;
        updatedItem.subtotal = itemSubtotal - discountAmount;
        
        return updatedItem;
      }
      return item;
    });

    updateFormData({ items: updatedItems });
  };

  const handlePriceTypeChange = (itemId: string, priceTypeId: string) => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item || item.item_type !== 'sku' || !item.sku) return;

    let newPrice = item.sku.base_mrp || 0;
    
    // Check if the SKU has a specific price for this price type
    if (item.sku.price_type_prices && priceTypeId && priceTypeId !== 'default') {
      const priceTypePrice = item.sku.price_type_prices[priceTypeId];
      if (priceTypePrice) {
        newPrice = priceTypePrice;
      }
    }

    handleUpdateItem(itemId, {
      price_type_id: priceTypeId === 'default' ? undefined : priceTypeId,
      unit_price: newPrice
    });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((total, item) => total + item.subtotal, 0);
  };

  return (
    <div className="space-y-6">
      {/* Add Items */}
      <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for SKUs or Classes..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearch(e.target.value.length >= 2);
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAddMiscItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Misc Item
            </Button>
          </div>

          {showSearch && searchTerm.length >= 2 && (
            <Card className="border-2">
              <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="skus">
                      SKUs ({skuSearchResults.length})
                    </TabsTrigger>
                    <TabsTrigger value="classes">
                      Classes ({classSearchResults.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="skus" className="mt-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-4">Searching...</div>
                      ) : skuSearchResults.length > 0 ? (
                        skuSearchResults.map((sku) => (
                          <div
                            key={sku.id}
                            className="p-3 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border"
                            onClick={() => handleSkuSelect(sku)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{sku.sku_code}</div>
                                <div className="text-sm text-muted-foreground">
                                  {sku.class?.name} - {sku.size?.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {sku.class?.style?.brand?.name} • {sku.class?.style?.category?.name}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">₹{sku.base_mrp?.toLocaleString('en-IN')}</div>
                                <Badge variant="outline">{sku.status}</Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No SKUs found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="classes" className="mt-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {loading ? (
                        <div className="text-center py-4">Searching...</div>
                      ) : classSearchResults.length > 0 ? (
                        classSearchResults.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="p-3 hover:bg-muted rounded-lg cursor-pointer border border-transparent hover:border-border"
                            onClick={() => handleClassSelect(classItem)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{classItem.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {classItem.description}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {classItem.style?.brand?.name} • {classItem.style?.category?.name}
                                </div>
                              </div>
                              <Badge variant="outline">{classItem.status}</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No Classes found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Selected Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Selected Items ({formData.items.length})
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="text-lg font-semibold">
              Total: ₹{getTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
          {formData.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Price Type</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-24">Discount %</TableHead>
                  <TableHead className="w-32 text-right">Subtotal</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.item_type === 'sku' ? (
                        <div>
                          <div className="font-medium">{item.sku?.sku_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.sku?.class?.name} - {item.size?.name}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {editingMiscItemId === item.id ? (
                            <Input
                              value={item.misc_name || ''}
                              onChange={(e) => handleUpdateItem(item.id, { misc_name: e.target.value })}
                              onBlur={() => setEditingMiscItemId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingMiscItemId(null)}
                              placeholder="Enter item name"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                              onClick={() => setEditingMiscItemId(item.id)}
                            >
                              {item.misc_name || 'Click to edit'}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {item.item_type === 'sku' ? (
                        <Select
                          value={item.price_type_id || 'default'}
                          onValueChange={(value) => handlePriceTypeChange(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            {priceTypes.map((priceType) => (
                              <SelectItem key={priceType.id} value={priceType.id}>
                                {priceType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-28"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount_percentage}
                        onChange={(e) => handleUpdateItem(item.id, { discount_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </TableCell>
                    
                    <TableCell className="text-right font-medium">
                      ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items added yet</p>
              <p className="text-sm">Search for SKUs/Classes or add misc items to get started</p>
            </div>
          )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Trash2, 
  Package,
  ShoppingCart,
  Calculator,
  FileText,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { purchaseOrderService, PurchaseOrderItem, PurchaseOrderMiscItem } from '@/services/purchaseOrderService';
import { toast } from 'sonner';
import ClassSelectionModal from './ClassSelectionModal';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Size {
  id: string;
  name: string;
  code: string;
}

interface SKU {
  id: string;
  code: string;
  name: string;
  description: string;
  brand: string;
  color: string;
  size: Size;
}

interface Class {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  skus: SKU[];
}

interface SelectedItem {
  id: string;
  type: 'sku' | 'misc';
  name: string;
  description?: string;
  sizes: {
    sizeId: string;
    sizeName: string;
    quantity: number;
    price: number;
    amount: number;
  }[];
  totalAmount: number;
}

interface MiscItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  amount: number;
}

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [miscItems, setMiscItems] = useState<MiscItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isClassSelectionOpen, setIsClassSelectionOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for sizes
  const sizes: Size[] = [
    { id: '1', name: '8', code: '8' },
    { id: '2', name: '9', code: '9' },
    { id: '3', name: '10', code: '10' },
    { id: '4', name: 'L', code: 'L' },
    { id: '5', name: 'M', code: 'M' },
    { id: '6', name: 'S', code: 'S' },
  ];

  const [newMiscItem, setNewMiscItem] = useState({
    name: '',
    quantity: 0,
    price: 0
  });

  // Fetch vendors from database
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching vendors:', error);
          toast.error('Failed to load vendors');
          return;
        }

        // Use mock data if database fails
        if (error || !data || data.length === 0) {
          const mockVendors = [
            { id: '1', name: 'Vendor A', email: 'vendorA@example.com', phone: '+1234567890' },
            { id: '2', name: 'Vendor B', email: 'vendorB@example.com', phone: '+1234567891' },
            { id: '3', name: 'Vendor C', email: 'vendorC@example.com', phone: '+1234567892' },
          ];
          setVendors(mockVendors);
        } else {
          setVendors(data);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  // Calculate totals
  const selectedItemsTotal = selectedItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const miscItemsTotal = miscItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = selectedItemsTotal + miscItemsTotal;

  const handleAddClass = (classItem: Class) => {
    // Check for existing SKUs to avoid duplicates
    const existingSkuIds = new Set(selectedItems.map(item => item.id.replace('sku-', '')));
    const newSkus = classItem.skus.filter(sku => !existingSkuIds.has(sku.id));
    const duplicateSkus = classItem.skus.filter(sku => existingSkuIds.has(sku.id));
    
    if (newSkus.length === 0) {
      toast.error(`All SKUs from class "${classItem.name}" are already in the purchase order`);
      return;
    }
    
    // Add only new SKUs
    const newItems: SelectedItem[] = newSkus.map(sku => ({
      id: `sku-${sku.id}`,
      type: 'sku',
      name: sku.name,
      description: sku.description,
      sizes: [{
        sizeId: sku.size.id,
        sizeName: sku.size.name,
        quantity: 0,
        price: 0,
        amount: 0
      }],
      totalAmount: 0
    }));
    
    setSelectedItems(prev => [...prev, ...newItems]);
    
    // Show appropriate toast notifications
    if (duplicateSkus.length > 0) {
      toast.warning(`Added ${newSkus.length} new SKUs from class "${classItem.name}". ${duplicateSkus.length} SKUs were already in the purchase order.`);
    } else {
      toast.success(`Added ${newSkus.length} SKUs from class "${classItem.name}"`);
    }
  };

  const handleAddSKU = (sku: SKU) => {
    // Check if SKU already exists
    const existingSkuId = `sku-${sku.id}`;
    const skuExists = selectedItems.some(item => item.id === existingSkuId);
    
    if (skuExists) {
      toast.error(`SKU "${sku.name}" is already in the purchase order`);
      return;
    }
    
    const newItem: SelectedItem = {
      id: existingSkuId,
      type: 'sku',
      name: sku.name,
      description: sku.description,
      sizes: [{
        sizeId: sku.size.id,
        sizeName: sku.size.name,
        quantity: 0,
        price: 0,
        amount: 0
      }],
      totalAmount: 0
    };
    setSelectedItems(prev => [...prev, newItem]);
    
    // Show a toast notification
    toast.success(`Added SKU "${sku.name}"`);
  };

  const handleUpdateItemSize = (itemId: string, sizeId: string, field: 'quantity' | 'price', value: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedSizes = item.sizes.map(size => {
          if (size.sizeId === sizeId) {
            const updatedSize = { ...size, [field]: value };
            updatedSize.amount = updatedSize.quantity * updatedSize.price;
            return updatedSize;
          }
          return size;
        });
        const totalAmount = updatedSizes.reduce((sum, size) => sum + size.amount, 0);
        return { ...item, sizes: updatedSizes, totalAmount };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddMiscItem = () => {
    if (newMiscItem.name && newMiscItem.quantity > 0 && newMiscItem.price > 0) {
      const miscItem: MiscItem = {
        id: `misc-${Date.now()}`,
        name: newMiscItem.name,
        quantity: newMiscItem.quantity,
        price: newMiscItem.price,
        amount: newMiscItem.quantity * newMiscItem.price
      };
      setMiscItems([...miscItems, miscItem]);
      setNewMiscItem({ name: '', quantity: 0, price: 0 });
    }
  };

  const handleRemoveMiscItem = (itemId: string) => {
    setMiscItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleCreatePO = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (selectedItems.length === 0 && miscItems.length === 0) {
      toast.error('Please add at least one item to the purchase order');
      return;
    }

    try {
      setSubmitting(true);

      // Transform selected items to PO items
      const poItems: PurchaseOrderItem[] = selectedItems.map(item => ({
        sku_id: item.id.replace('sku-', ''),
        size_id: item.sizes[0].sizeId,
        quantity: item.sizes[0].quantity,
        unit_price: item.sizes[0].price,
        total_price: item.sizes[0].amount
      }));

      // Transform misc items to PO misc items
      const poMiscItems: PurchaseOrderMiscItem[] = miscItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.amount
      }));

      // Create the purchase order
      await purchaseOrderService.createPurchaseOrder({
        vendor_id: selectedVendor,
        notes: notes || undefined,
        items: poItems,
        misc_items: poMiscItems
      });

      toast.success('Purchase order created successfully');
      
      // Reset form
      setSelectedVendor('');
      setSelectedItems([]);
      setMiscItems([]);
      setNotes('');
      
      // Close modal and call success callback
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create Purchase Order</DialogTitle>
            <DialogDescription>
              Select a vendor, add classes/SKUs, and configure quantities and prices to create a new purchase order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vendor Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Select Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedVendor} onValueChange={setSelectedVendor} disabled={loading || submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading vendors..." : "Choose a vendor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-muted-foreground">{vendor.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>



            {/* Selected Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Selected Items
                  </CardTitle>
                  <Button 
                    onClick={() => setIsClassSelectionOpen(true)}
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Browse and Select Classes/SKUs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium mb-2">No Items Selected</h4>
                    <p className="text-sm">Click the button above to browse and select classes/SKUs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItems.map(item => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <Badge variant="secondary" className="mt-1">
                              SKU
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Total: ₹{item.totalAmount.toLocaleString()}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={submitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Size</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price (₹)</TableHead>
                              <TableHead>Amount (₹)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {item.sizes.map(size => (
                              <TableRow key={size.sizeId}>
                                <TableCell className="font-medium">{size.sizeName}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={size.quantity}
                                    onChange={(e) => handleUpdateItemSize(item.id, size.sizeId, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={size.price}
                                    onChange={(e) => handleUpdateItemSize(item.id, size.sizeId, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  ₹{size.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              </Card>

            {/* Miscellaneous Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Miscellaneous Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Misc Item */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="misc-name">Item Name</Label>
                    <Input
                      id="misc-name"
                      value={newMiscItem.name}
                      onChange={(e) => setNewMiscItem({...newMiscItem, name: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="misc-quantity">Quantity</Label>
                    <Input
                      id="misc-quantity"
                      type="number"
                      min="0"
                      value={newMiscItem.quantity}
                      onChange={(e) => setNewMiscItem({...newMiscItem, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="misc-price">Price (₹)</Label>
                    <Input
                      id="misc-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newMiscItem.price}
                      onChange={(e) => setNewMiscItem({...newMiscItem, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddMiscItem} className="w-full" disabled={submitting}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Misc Items List */}
                {miscItems.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price (₹)</TableHead>
                        <TableHead>Amount (₹)</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {miscItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.price.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">₹{item.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMiscItem(item.id)}
                              disabled={submitting}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any additional notes for this purchase order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Selected Items Total:</span>
                    <span className="font-medium">₹{selectedItemsTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miscellaneous Items Total:</span>
                    <span className="font-medium">₹{miscItemsTotal.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO} disabled={submitting || !selectedVendor || (selectedItems.length === 0 && miscItems.length === 0)}>
                {submitting ? 'Creating...' : 'Create Purchase Order'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Class Selection Modal */}
      <ClassSelectionModal
        isOpen={isClassSelectionOpen}
        onClose={() => setIsClassSelectionOpen(false)}
        onAddClass={handleAddClass}
        onAddSKU={handleAddSKU}
      />
    </>
  );
};

export default CreatePOModal;

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Trash2, 
  Package,
  ShoppingCart,
  Calculator,
  FileText,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { purchaseOrderService, PurchaseOrderItem, PurchaseOrderMiscItem, PurchaseOrderDraft } from '@/services/purchaseOrderService';
import { toast } from 'sonner';

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
  skuCode?: string; // Add SKU code for SKU items
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
  onDraftSaved?: () => void;
  editingDraftId?: string | null;
}

const CreatePOModal: React.FC<CreatePOModalProps> = ({ isOpen, onClose, onSuccess, onDraftSaved, editingDraftId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [miscItems, setMiscItems] = useState<MiscItem[]>([]);
  const [notes, setNotes] = useState('');
  const [editingMiscItemId, setEditingMiscItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [skuSearchResults, setSkuSearchResults] = useState<SKU[]>([]);
  const [classSearchResults, setClassSearchResults] = useState<Class[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [allSkus, setAllSkus] = useState<SKU[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [activeTab, setActiveTab] = useState('skus');
  const [loading, setLoading] = useState(false);
  const [addedClassIds, setAddedClassIds] = useState<Set<string>>(new Set());
  const [addedSKUIds, setAddedSKUIds] = useState<Set<string>>(new Set());
  const [classToSKUsMap, setClassToSKUsMap] = useState<Map<string, Set<string>>>(new Map());
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  // Mock data for sizes
  const sizes: Size[] = [
    { id: '1', name: '8', code: '8' },
    { id: '2', name: '9', code: '9' },
    { id: '3', name: '10', code: '10' },
    { id: '4', name: 'L', code: 'L' },
    { id: '5', name: 'M', code: 'M' },
    { id: '6', name: 'S', code: 'S' },
  ];


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
          // Use mock data if database fails
          const mockVendors = [
            { id: '1', name: 'Vendor A', email: 'vendorA@example.com', phone: '+1234567890' },
            { id: '2', name: 'Vendor B', email: 'vendorB@example.com', phone: '+1234567891' },
            { id: '3', name: 'Vendor C', email: 'vendorC@example.com', phone: '+1234567892' },
          ];
          setVendors(mockVendors);
          setFilteredVendors(mockVendors);
          toast.warning('Using demo vendors. Database connection issue detected.');
          return;
        }

        if (data && data.length > 0) {
          setVendors(data);
          setFilteredVendors(data);
        } else {
          // Use mock data if no vendors found
          const mockVendors = [
            { id: '1', name: 'Vendor A', email: 'vendorA@example.com', phone: '+1234567890' },
            { id: '2', name: 'Vendor B', email: 'vendorB@example.com', phone: '+1234567891' },
            { id: '3', name: 'Vendor C', email: 'vendorC@example.com', phone: '+1234567892' },
          ];
          setVendors(mockVendors);
          setFilteredVendors(mockVendors);
          toast.info('No vendors found. Using demo data.');
        }
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
        // Use mock data as fallback
        const mockVendors = [
          { id: '1', name: 'Vendor A', email: 'vendorA@example.com', phone: '+1234567890' },
          { id: '2', name: 'Vendor B', email: 'vendorB@example.com', phone: '+1234567891' },
          { id: '3', name: 'Vendor C', email: 'vendorC@example.com', phone: '+1234567892' },
        ];
        setVendors(mockVendors);
        setFilteredVendors(mockVendors);
        toast.error('Failed to load vendors. Using demo data.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  // Fetch all SKUs and Classes for search
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            description,
            style:styles(
              name,
              brand:brands(name),
              category:categories(name)
            ),
            color:colors(name)
          `)
          .order('name');

        const { data: skusData, error: skusError } = await supabase
          .from('skus')
          .select(`
            id,
            sku_code,
            description,
            size_id,
            class_id
          `)
          .order('sku_code');

        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('id, name, code')
          .order('name');

        if (classesError || skusError || sizesError) {
          console.error('Error fetching data:', { classesError, skusError, sizesError });
          // Use mock data
          const mockClasses: Class[] = [
            {
              id: '1',
              name: 'Air Jordan 1 Retro High OG - Chicago',
              description: 'Classic Air Jordan 1 in Chicago colorway',
              brand: 'Nike',
              category: 'Sneakers',
              skus: [
                {
                  id: '1',
                  code: 'AJ1-CHI-8',
                  name: 'Air Jordan 1 Retro High OG - Chicago',
                  description: 'Air Jordan 1 Retro High | Red | 8',
                  brand: 'Nike',
                  color: 'Red',
                  size: { id: '1', name: '8', code: '8' }
                },
                {
                  id: '2',
                  code: 'AJ1-CHI-9',
                  name: 'Air Jordan 1 Retro High OG - Chicago',
                  description: 'Air Jordan 1 Retro High | Red | 9',
                  brand: 'Nike',
                  color: 'Red',
                  size: { id: '2', name: '9', code: '9' }
                }
              ]
            },
            {
              id: '2',
              name: 'Metcon 7 CrossFit Training Shoe',
              description: 'High-performance training shoe',
              brand: 'Nike',
              category: 'Training',
              skus: [
                {
                  id: '3',
                  code: 'METCON7-BLUE-9',
                  name: 'Metcon 7 CrossFit Training Shoe',
                  description: 'Metcon 7 | Blue | 9',
                  brand: 'Nike',
                  color: 'Blue',
                  size: { id: '2', name: '9', code: '9' }
                }
              ]
            }
          ];
          
          const mockSkus: SKU[] = mockClasses.flatMap(cls => cls.skus);
          setAllClasses(mockClasses);
          setAllSkus(mockSkus);
          return;
        }

        // Create a map of sizes for quick lookup
        const sizesMap = new Map();
        (sizesData || []).forEach(size => {
          sizesMap.set(size.id, size);
        });

        // Transform classes data
        const transformedClasses: Class[] = (classesData || []).map(cls => {
          // Find SKUs for this class
          const classSkus = (skusData || []).filter(sku => sku.class_id === cls.id);
          
          // Transform SKUs to match our interface
          const transformedSkus: SKU[] = classSkus.map(sku => {
            const size = sizesMap.get(sku.size_id);
            return {
              id: sku.id,
              code: sku.sku_code,
              name: cls.name, // Use class name as SKU name
              description: sku.description || '',
              brand: cls.style?.brand?.name || 'No Brand',
              color: cls.color?.name || 'No Color',
              size: size ? {
                id: size.id,
                name: size.name,
                code: size.code
              } : {
                id: 'unknown',
                name: 'Unknown',
                code: 'Unknown'
              }
            };
          });

          return {
            id: cls.id,
            name: cls.name,
            description: cls.description || '',
            brand: cls.style?.brand?.name || 'No Brand',
            category: cls.style?.category?.name || 'No Category',
            skus: transformedSkus
          };
        });

        // Transform SKUs data
        const transformedSkus: SKU[] = (skusData || []).map(sku => {
          const classData = (classesData || []).find(cls => cls.id === sku.class_id);
          const size = sizesMap.get(sku.size_id);
          
          return {
            id: sku.id,
            code: sku.sku_code,
            name: classData?.name || 'Unknown Class',
            description: sku.description || '',
            brand: classData?.style?.brand?.name || 'No Brand',
            color: classData?.color?.name || 'No Color',
            size: size ? {
              id: size.id,
              name: size.name,
              code: size.code
            } : {
              id: 'unknown',
              name: 'Unknown',
              code: 'Unknown'
            }
          };
        });

        setAllClasses(transformedClasses);
        setAllSkus(transformedSkus);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data as fallback
        const mockClasses: Class[] = [
          {
            id: '1',
            name: 'Air Jordan 1 Retro High OG - Chicago',
            description: 'Classic Air Jordan 1 in Chicago colorway',
            brand: 'Nike',
            category: 'Sneakers',
            skus: [
              {
                id: '1',
                code: 'AJ1-CHI-8',
                name: 'Air Jordan 1 Retro High OG - Chicago',
                description: 'Air Jordan 1 Retro High | Red | 8',
                brand: 'Nike',
                color: 'Red',
                size: { id: '1', name: '8', code: '8' }
              },
              {
                id: '2',
                code: 'AJ1-CHI-9',
                name: 'Air Jordan 1 Retro High OG - Chicago',
                description: 'Air Jordan 1 Retro High | Red | 9',
                brand: 'Nike',
                color: 'Red',
                size: { id: '2', name: '9', code: '9' }
              }
            ]
          },
          {
            id: '2',
            name: 'Metcon 7 CrossFit Training Shoe',
            description: 'High-performance training shoe',
            brand: 'Nike',
            category: 'Training',
            skus: [
              {
                id: '3',
                code: 'METCON7-BLUE-9',
                name: 'Metcon 7 CrossFit Training Shoe',
                description: 'Metcon 7 | Blue | 9',
                brand: 'Nike',
                color: 'Blue',
                size: { id: '2', name: '9', code: '9' }
              }
            ]
          }
        ];
        
        const mockSkus: SKU[] = mockClasses.flatMap(cls => cls.skus);
        setAllClasses(mockClasses);
        setAllSkus(mockSkus);
      }
    };

    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen]);

  // Load draft data when editing
  useEffect(() => {
    const loadDraftForEditing = async () => {
      if (editingDraftId && isOpen) {
        try {
          console.log('Loading draft for editing:', editingDraftId);
          const draft = await purchaseOrderService.getDraft(editingDraftId);
          console.log('Loaded draft data:', draft);
          
          if (draft) {
            setSelectedVendor(draft.vendor_id || '');
            setNotes(draft.notes || '');
            setCurrentStep(1); // Start from step 1 when editing
            setCurrentDraftId(editingDraftId);
            
            // Load items from draft
            if (draft.items && draft.items.length > 0) {
              console.log('Draft items:', draft.items);
              const transformedItems: SelectedItem[] = draft.items.map(item => {
                console.log('Transforming item:', item);
                const transformed = {
                  id: `sku-${item.sku_id}`,
                  type: 'sku' as const,
                  name: item.sku_name,
                  skuCode: item.sku_code,
                  description: '',
                  sizes: [{
                    sizeId: item.size_id,
                    sizeName: item.size_name,
                    quantity: item.quantity,
                    price: item.unit_price,
                    amount: item.total_price
                  }],
                  totalAmount: item.total_price
                };
                console.log('Transformed item:', transformed);
                return transformed;
              });
              console.log('Setting selected items:', transformedItems);
              setSelectedItems(transformedItems);
            }
            
            // Load misc items from draft
            if (draft.misc_items && draft.misc_items.length > 0) {
              const transformedMiscItems: MiscItem[] = draft.misc_items.map(item => ({
                id: `misc-${Date.now()}-${Math.random()}`,
                name: item.name,
                quantity: item.quantity,
                price: item.unit_price,
                amount: item.total_price
              }));
              setMiscItems(transformedMiscItems);
            }
          }
        } catch (error) {
          console.error('Error loading draft for editing:', error);
          toast.error('Failed to load draft for editing');
        }
      }
    };

    loadDraftForEditing();
  }, [editingDraftId, isOpen]);

  // Filter vendors based on search term
  useEffect(() => {
    if (vendorSearchTerm.trim() === '') {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(vendorSearchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [vendorSearchTerm, vendors]);

  // Filter SKUs and Classes based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSkuSearchResults([]);
      setClassSearchResults([]);
      setShowSearch(false);
    } else {
      const searchLower = searchTerm.toLowerCase();
      
      // Filter SKUs
      const filteredSkus = allSkus.filter(sku => (
        sku.code.toLowerCase().includes(searchLower) ||
        sku.name.toLowerCase().includes(searchLower) ||
        sku.description.toLowerCase().includes(searchLower) ||
        sku.brand.toLowerCase().includes(searchLower) ||
        sku.color.toLowerCase().includes(searchLower) ||
        sku.size.name.toLowerCase().includes(searchLower)
      )).slice(0, 10); // Limit to 10 results
      
      // Filter Classes - only show classes that have SKUs
      const filteredClasses = allClasses.filter(cls => 
        cls.skus.length > 0 && (
          cls.name.toLowerCase().includes(searchLower) ||
          cls.description.toLowerCase().includes(searchLower) ||
          cls.brand.toLowerCase().includes(searchLower) ||
          cls.category.toLowerCase().includes(searchLower) ||
          cls.skus.some(sku => 
            sku.code.toLowerCase().includes(searchLower) ||
            sku.name.toLowerCase().includes(searchLower)
          )
        )
      ).slice(0, 10); // Limit to 10 results
      
      setSkuSearchResults(filteredSkus);
      setClassSearchResults(filteredClasses);
      setShowSearch(true);
    }
  }, [searchTerm, allSkus, allClasses]);

  // Calculate totals
  const selectedItemsTotal = selectedItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const miscItemsTotal = miscItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = selectedItemsTotal + miscItemsTotal;

  // Stepper navigation functions
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedVendor('');
    setSelectedItems([]);
    setMiscItems([]);
    setNotes('');
    setVendorSearchTerm('');
    setSearchTerm('');
    setSkuSearchResults([]);
    setClassSearchResults([]);
    setShowSearch(false);
    setEditingMiscItemId(null);
    setActiveTab('skus');
    setAddedClassIds(new Set());
    setAddedSKUIds(new Set());
    setClassToSKUsMap(new Map());
    setCurrentDraftId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);

      // Validate that we have something to save
      if (!selectedVendor && selectedItems.length === 0 && miscItems.length === 0 && !notes) {
        toast.error('Nothing to save. Please add some items or select a vendor first.');
        return;
      }

      // Check authentication status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.warning('You are not logged in. Draft will be saved locally but may not persist across sessions.');
      }

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

      const draftId = await purchaseOrderService.saveDraft({
        vendor_id: selectedVendor || undefined,
        notes: notes || undefined,
        items: poItems,
        misc_items: poMiscItems
      }, currentStep, currentDraftId || undefined);

      setCurrentDraftId(draftId);
      toast.success('Draft saved successfully');
      onDraftSaved?.(); // Trigger table refresh
    } catch (error: any) {
      console.error('Error saving draft:', error);
      const errorMessage = error?.message || 'Failed to save draft';
      toast.error(errorMessage);
    } finally {
      setSavingDraft(false);
    }
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
    setSelectedItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      
      // Update added SKU IDs when removing items
      if (itemId.startsWith('sku-')) {
        const skuId = itemId.replace('sku-', '');
        setAddedSKUIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(skuId);
          return newSet;
        });
        
        // Check if we need to remove any class IDs
        setAddedClassIds(prev => {
          const newSet = new Set(prev);
          // Check each class to see if any SKUs from that class are still added
          classToSKUsMap.forEach((classSKUs, classId) => {
            if (classSKUs.has(skuId)) {
              // This SKU belonged to a class, check if any other SKUs from this class are still added
              const remainingClassSKUs = Array.from(classSKUs).filter(id => id !== skuId);
              const hasRemainingSKUs = remainingClassSKUs.some(id => 
                filtered.some(item => item.id === `sku-${id}`)
              );
              
              if (!hasRemainingSKUs) {
                // No more SKUs from this class are in the purchase order
                newSet.delete(classId);
              }
            }
          });
          return newSet;
        });
      }
      
      return filtered;
    });
  };

  const handleAddMiscItem = () => {
    const newItem: MiscItem = {
      id: `misc-${Date.now()}-${Math.random()}`,
      name: '',
      quantity: 0,
      price: 0,
      amount: 0
    };

    setMiscItems(prev => [...prev, newItem]);
    setEditingMiscItemId(newItem.id);
  };

  const handleRemoveMiscItem = (itemId: string) => {
    setMiscItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateMiscItem = (itemId: string, field: 'name' | 'quantity' | 'price', value: string | number) => {
    setMiscItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedItem.amount = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleMiscItemNameBlur = (itemId: string) => {
    setEditingMiscItemId(null);
  };

  const handleMiscItemNameKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter') {
      setEditingMiscItemId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSkuSelect = (sku: SKU) => {
    // Check if SKU already exists
    const existingSkuId = `sku-${sku.id}`;
    const skuExists = selectedItems.some(item => item.id === existingSkuId);
    
    if (skuExists) {
      toast.error(`SKU "${sku.code}" is already in the purchase order`);
      return;
    }
    
    const newItem: SelectedItem = {
      id: existingSkuId,
      type: 'sku',
      name: sku.name,
      skuCode: sku.code,
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
    setAddedSKUIds(prev => new Set([...prev, sku.id]));
    setSearchTerm('');
    setShowSearch(false);
    
    toast.success(`Added SKU: ${sku.code}`);
  };

  const handleClassSelect = (classItem: Class) => {
    // Check for existing SKUs to avoid duplicates
    const existingSkuIds = new Set(selectedItems.map(item => item.id.replace('sku-', '')));
    const newSkus = classItem.skus.filter(sku => !existingSkuIds.has(sku.id));
    const duplicateSkus = classItem.skus.filter(sku => existingSkuIds.has(sku.id));
    
    if (newSkus.length === 0) {
      if (classItem.skus.length === 0) {
        toast.error(`Class "${classItem.name}" has no SKUs available`);
      } else {
        toast.error(`All SKUs from class "${classItem.name}" are already in the purchase order`);
      }
      return;
    }
    
    // Add only new SKUs
    const newItems: SelectedItem[] = newSkus.map(sku => ({
      id: `sku-${sku.id}`,
      type: 'sku',
      name: sku.name,
      skuCode: sku.code,
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
    
    // Track added class and SKU IDs
    setAddedClassIds(prev => new Set([...prev, classItem.id]));
    setAddedSKUIds(prev => {
      const newSet = new Set(prev);
      classItem.skus.forEach(sku => newSet.add(sku.id));
      return newSet;
    });
    
    // Track class to SKU mapping
    setClassToSKUsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(classItem.id, new Set(classItem.skus.map(sku => sku.id)));
      return newMap;
    });
    
    setSearchTerm('');
    setShowSearch(false);
    
    // Show appropriate toast notifications
    if (duplicateSkus.length > 0) {
      toast.warning(`Added ${newSkus.length} new SKUs from class "${classItem.name}". ${duplicateSkus.length} SKUs were already in the purchase order.`);
    } else {
      toast.success(`Added ${newSkus.length} SKUs from class "${classItem.name}"`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setShowSearch(false);
    }
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

      // Create or update the purchase order
      if (editingDraftId) {
        // Update existing draft
        await purchaseOrderService.updateDraft({
          vendor_id: selectedVendor,
          notes: notes || undefined,
          items: poItems,
          misc_items: poMiscItems
        }, editingDraftId);
      } else {
        // Create new purchase order
        await purchaseOrderService.createPurchaseOrder({
          vendor_id: selectedVendor,
          notes: notes || undefined,
          items: poItems,
          misc_items: poMiscItems
        }, currentDraftId || undefined);
      }

      toast.success(editingDraftId ? 'Purchase order updated successfully' : 'Purchase order created successfully');
      
      // Reset form and close modal
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // Memoize arrays to prevent unnecessary re-renders
  const memoizedAddedClasses = useMemo(() => Array.from(addedClassIds), [addedClassIds]);
  const memoizedAddedSKUs = useMemo(() => Array.from(addedSKUIds), [addedSKUIds]);

  // Step validation
  const canProceedToStep2 = selectedVendor !== '';
  const canProceedToStep3 = selectedItems.length > 0 || miscItems.length > 0;
  const canCreatePO = selectedVendor !== '' && (selectedItems.length > 0 || miscItems.length > 0);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Vendor Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search vendors by name or email..."
                value={vendorSearchTerm}
                onChange={(e) => setVendorSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            {/* Vendor List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading vendors...</div>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No vendors found</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVendor === vendor.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedVendor(vendor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedVendor === vendor.id
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {selectedVendor === vendor.id && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {vendor.name}
                            </div>
                            <div className="text-sm text-muted-foreground">{vendor.email}</div>
                            {vendor.phone && (
                              <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Add Items Section */}
            <div className="space-y-4">
              {/* Search and Add Misc Item Row */}
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Search Items</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by SKU code, class name, brand, color, or size..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddMiscItem}
                  variant="outline"
                  disabled={submitting}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Add Misc Item
                </Button>
              </div>
              
              {/* Search Results with Tabs */}
              {showSearch && (skuSearchResults.length > 0 || classSearchResults.length > 0) && (
                <div className="border rounded-lg bg-background shadow-lg">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="skus" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        SKUs ({skuSearchResults.length})
                      </TabsTrigger>
                      <TabsTrigger value="classes" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Classes ({classSearchResults.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="skus" className="p-0">
                      <div className="max-h-60 overflow-y-auto">
                        {skuSearchResults.length > 0 ? (
                          skuSearchResults.map(sku => (
                            <div
                              key={sku.id}
                              className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleSkuSelect(sku)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{sku.code}</div>
                                  <div className="text-sm text-muted-foreground">{sku.name}</div>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{sku.brand}</Badge>
                                    <Badge variant="outline" className="text-xs">{sku.color}</Badge>
                                    <Badge variant="outline" className="text-xs">Size: {sku.size.name}</Badge>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground" />
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
                    
                    <TabsContent value="classes" className="p-0">
                      <div className="max-h-60 overflow-y-auto">
                        {classSearchResults.length > 0 ? (
                          classSearchResults.map(cls => (
                            <div
                              key={cls.id}
                              className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                              onClick={() => handleClassSelect(cls)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{cls.name}</div>
                                  <div className="text-sm text-muted-foreground">{cls.description}</div>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{cls.brand}</Badge>
                                    <Badge variant="outline" className="text-xs">{cls.category}</Badge>
                                    <Badge variant="secondary" className="text-xs">{cls.skus.length} SKUs</Badge>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-muted-foreground" />
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
                </div>
              )}
              
              {showSearch && skuSearchResults.length === 0 && classSearchResults.length === 0 && searchTerm.trim() !== '' && (
                <div className="text-center py-4 text-muted-foreground">
                  No items found matching "{searchTerm}"
                </div>
              )}
            </div>

            {/* Combined Items Table */}
            {(selectedItems.length > 0 || miscItems.length > 0) && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Items ({selectedItems.length + miscItems.length})
                </h4>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price (₹)</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* SKU Items */}
                    {selectedItems.map(item => {
                      console.log('Rendering SKU item:', item);
                      return item.sizes.map((size, sizeIndex) => {
                        console.log('Rendering size:', size);
                        return (
                          <TableRow key={`sku-${item.id}-${size.sizeId}`}>
                            {sizeIndex === 0 && (
                              <TableCell 
                                rowSpan={item.sizes.length} 
                                className="font-medium align-top"
                              >
                                <div className="space-y-1">
                                  <div>{item.skuCode || item.name}</div>
                                </div>
                              </TableCell>
                            )}
                            {sizeIndex === 0 && (
                              <TableCell 
                                rowSpan={item.sizes.length}
                                className="align-top"
                              >
                                <Badge variant="secondary" className="text-xs">
                                  SKU
                                </Badge>
                              </TableCell>
                            )}
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
                            {sizeIndex === 0 && (
                              <TableCell 
                                rowSpan={item.sizes.length}
                                className="align-top"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={submitting}
                                  className="w-full"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                    
                    {/* Miscellaneous Items */}
                    {miscItems.map(item => (
                      <TableRow key={`misc-${item.id}`}>
                        <TableCell className="font-medium">
                          {editingMiscItemId === item.id ? (
                            <Input
                              value={item.name}
                              onChange={(e) => handleUpdateMiscItem(item.id, 'name', e.target.value)}
                              onBlur={() => handleMiscItemNameBlur(item.id)}
                              onKeyDown={(e) => handleMiscItemNameKeyDown(e, item.id)}
                              placeholder="Enter item name"
                              className="w-full"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-muted/50 p-1 rounded"
                              onClick={() => setEditingMiscItemId(item.id)}
                            >
                              {item.name || 'Click to enter item name'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Misc
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleUpdateMiscItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleUpdateMiscItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{item.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMiscItem(item.id)}
                            disabled={submitting}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes for this purchase order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Selected Vendor */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Selected Vendor
              </h4>
              {selectedVendor && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{vendors.find(v => v.id === selectedVendor)?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendors.find(v => v.id === selectedVendor)?.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div className="space-y-4">
              {(selectedItems.length > 0 || miscItems.length > 0) && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Items ({selectedItems.length + miscItems.length})
                  </h4>
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* SKU Items */}
                        {selectedItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.skuCode || item.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">SKU</Badge>
                            </TableCell>
                            <TableCell>{item.sizes[0]?.sizeName}</TableCell>
                            <TableCell>{item.sizes[0]?.quantity}</TableCell>
                            <TableCell>₹{item.sizes[0]?.price.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₹{item.totalAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Miscellaneous Items */}
                        {miscItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">Misc</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">-</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.price.toLocaleString()}</TableCell>
                            <TableCell className="font-medium">₹{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Order Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Items: {selectedItems.length + miscItems.length}</span>
                  <span className="font-medium">₹{grandTotal.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingDraftId ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </DialogTitle>
            <DialogDescription>
              {editingDraftId 
                ? 'Edit the draft purchase order details' 
                : 'Follow the steps to create a new purchase order'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center space-x-4 py-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted-foreground'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <span className={currentStep === 1 ? 'text-primary font-medium' : ''}>Choose Vendor</span>
            <span className={currentStep === 2 ? 'text-primary font-medium' : ''}>Select Items</span>
            <span className={currentStep === 3 ? 'text-primary font-medium' : ''}>Review Order</span>
          </div>

          {/* Step Content */}
          <div className="py-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={savingDraft || submitting}
                className="flex items-center gap-2"
              >
                {savingDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
              
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3)
                  }
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreatePO}
                  disabled={!canCreatePO || submitting}
                  className="flex items-center gap-2"
                >
                  {submitting 
                    ? (editingDraftId ? 'Updating...' : 'Creating...') 
                    : (editingDraftId ? 'Update Purchase Order' : 'Create Purchase Order')
                  }
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>




    </>
  );
};

export default CreatePOModal;

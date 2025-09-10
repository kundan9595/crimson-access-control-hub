import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Package,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClass: (classItem: Class) => void;
  onAddSKU: (sku: SKU) => void;
  alreadyAddedClasses?: string[]; // Array of class IDs that are already added
  alreadyAddedSKUs?: string[]; // Array of SKU IDs that are already added
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  onClose,
  onAddClass,
  onAddSKU,
  alreadyAddedClasses = [],
  alreadyAddedSKUs = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [classes, setClasses] = useState<Class[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [addedClasses, setAddedClasses] = useState<Set<string>>(new Set(alreadyAddedClasses));
  const [addedSKUs, setAddedSKUs] = useState<Set<string>>(new Set(alreadyAddedSKUs));

  // Update local state when props change (only when modal is open)
  useEffect(() => {
    if (isOpen) {
      setAddedClasses(new Set(alreadyAddedClasses));
      setAddedSKUs(new Set(alreadyAddedSKUs));
    }
  }, [isOpen, alreadyAddedClasses, alreadyAddedSKUs]);

  // Fetch classes from database
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        
        // Fetch classes with their related data
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

        if (classesError) {
          console.error('Error fetching classes:', classesError);
          toast.error('Failed to load classes');
          return;
        }

        // Fetch SKUs for all classes
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

        if (skusError) {
          console.error('Error fetching SKUs:', skusError);
          toast.error('Failed to load SKUs');
          return;
        }

        // Fetch sizes separately
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('id, name, code')
          .order('name');

        if (sizesError) {
          console.error('Error fetching sizes:', sizesError);
          toast.error('Failed to load sizes');
          return;
        }

        if (skusError) {
          console.error('Error fetching SKUs:', skusError);
          toast.error('Failed to load SKUs');
          return;
        }

            // Raw data loaded

        // Debug: Log the exact SKU data we're working with
        // SKU debug information

        // Create a map of sizes for quick lookup
        const sizesMap = new Map();
        (sizesData || []).forEach(size => {
          sizesMap.set(size.id, size);
        });

        // Transform the data to match our interface
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
              brand: cls.style?.brand?.name || 'No Brand', // Use actual brand name
              color: cls.color?.name || 'No Color', // Use class color
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

        // Use mock data if database fails
        if (classesError || !classesData || classesData.length === 0) {
          const mockClasses = [
            {
              id: '1',
              name: 'Class 3',
              description: 'Air Jordan 1 Retro High OG - Chicago',
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
              name: 'Class 2',
              description: 'Metcon 7 CrossFit Training Shoe',
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
          // Using mock classes
          setClasses(mockClasses);
          setBrands(['Nike']);
          setCategories(['Sneakers', 'Training']);
        } else {
          // Using database classes
          setClasses(transformedClasses);
          // Extract unique brands and categories
          const uniqueBrands = [...new Set(transformedClasses.map(cls => cls.brand).filter(Boolean))];
          const uniqueCategories = [...new Set(transformedClasses.map(cls => cls.category).filter(Boolean))];
          
          setBrands(uniqueBrands);
          setCategories(uniqueCategories);
        }

      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(cls => {
    // Only show classes that have SKUs configured
    if (cls.skus.length === 0) {
      return false;
    }

    const matchesSearch = 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.skus.some(sku => 
        sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesBrand = brandFilter === 'all' || cls.brand === brandFilter;
    const matchesCategory = categoryFilter === 'all' || cls.category === categoryFilter;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Check if all SKUs in a class are added
  const areAllSKUsAdded = (classItem: Class) => {
    return classItem.skus.every(sku => addedSKUs.has(sku.id));
  };

  // Check if a class should be considered added (either explicitly added or all SKUs added)
  const isClassAdded = (classItem: Class) => {
    return addedClasses.has(classItem.id) || areAllSKUsAdded(classItem);
  };

  const handleAddClass = (classItem: Class) => {
    if (isClassAdded(classItem)) {
      toast.warning(`Class "${classItem.name}" is already added`);
      return; // Already added, do nothing
    }
    
    // Check for existing SKUs to avoid duplicates
    const existingSkuIds = new Set(addedSKUs);
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
    
    // Update local state first
    setAddedClasses(prev => new Set([...prev, classItem.id]));
    setAddedSKUs(prev => {
      const newSet = new Set(prev);
      classItem.skus.forEach(sku => newSet.add(sku.id));
      return newSet;
    });
    
    // Then call parent callback
    onAddClass(classItem);
    
    // Show appropriate toast notifications
    if (duplicateSkus.length > 0) {
      toast.warning(`Added ${newSkus.length} new SKUs from class "${classItem.name}". ${duplicateSkus.length} SKUs were already in the purchase order.`);
    } else {
      toast.success(`Added ${newSkus.length} SKUs from class "${classItem.name}"`);
    }
  };

  const handleAddSKU = (sku: SKU) => {
    if (addedSKUs.has(sku.id)) {
      toast.warning(`SKU "${sku.code}" is already in the purchase order`);
      return; // Already added, do nothing
    }
    
    // Update local state first
    setAddedSKUs(prev => new Set([...prev, sku.id]));
    
    // Then call parent callback
    onAddSKU(sku);
    
    toast.success(`Added SKU: ${sku.code}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBrandFilter('all');
    setCategoryFilter('all');
  };

  const resetAddedState = () => {
    setAddedClasses(new Set());
    setAddedSKUs(new Set());
  };

  // Reset added state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetAddedState();
    }
  }, [isOpen]);


  const hasActiveFilters = searchTerm || brandFilter !== 'all' || categoryFilter !== 'all';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select Classes & SKUs</DialogTitle>
            <DialogDescription>
              Search and browse classes and SKUs. Select a class to add all its SKUs, or expand to add individual SKUs.
            </DialogDescription>
          </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Search & Filters</h3>
          </div>
          
          {/* Search and Filters in one line */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search classes, SKUs, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Brand Filter */}
            <div className="sm:w-48">
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Classes List */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Classes & SKUs</h3>
            {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading classes...</div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {hasActiveFilters ? 'No classes found matching your filters.' : 'No classes available.'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClasses.map(cls => (
                <div key={cls.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{cls.name}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{cls.brand || 'No Brand'}</Badge>
                        <Badge variant="outline">{cls.category || 'No Category'}</Badge>
                        <Badge variant="secondary">{cls.skus.length} SKUs</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={isClassAdded(cls) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleAddClass(cls)}
                        disabled={isClassAdded(cls)}
                        className={isClassAdded(cls) ? "opacity-75" : ""}
                      >
                        {isClassAdded(cls) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            All Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add All SKUs
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExpandedClass(expandedClass === cls.id ? null : cls.id);
                        }}
                      >
                        {expandedClass === cls.id ? (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Hide SKUs
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4 mr-2" />
                            Show SKUs
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* SKUs under class */}
                  {expandedClass === cls.id && (
                    <div className="mt-4">
                      {cls.skus.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No SKUs available for this class.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU Code</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Color</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cls.skus.map(sku => (
                              <TableRow key={sku.id}>
                                <TableCell className="font-medium">{sku.code}</TableCell>
                                <TableCell>{sku.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{sku.color || 'No Color'}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{sku.size.name}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant={addedSKUs.has(sku.id) ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleAddSKU(sku)}
                                    disabled={addedSKUs.has(sku.id)}
                                    className={addedSKUs.has(sku.id) ? "opacity-75" : ""}
                                  >
                                    {addedSKUs.has(sku.id) ? (
                                      <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Already Added
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add SKU
                                      </>
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassSelectionModal;

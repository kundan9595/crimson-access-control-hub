import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Package,
  Filter,
  X,
  ChevronDown,
  ChevronRight
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
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  onClose,
  onAddClass,
  onAddSKU
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [classes, setClasses] = useState<Class[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

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

  const handleAddClass = (classItem: Class) => {
    onAddClass(classItem);
    toast.success(`Added class: ${classItem.name}`);
  };

  const handleAddSKU = (sku: SKU) => {
    onAddSKU(sku);
    toast.success(`Added SKU: ${sku.code}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBrandFilter('all');
    setCategoryFilter('all');
  };

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
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search classes, SKUs, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand-filter">Brand</Label>
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

              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
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

              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Classes & SKUs
              {loading && <span className="text-sm text-muted-foreground">(Loading...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  <div key={cls.id} className="border rounded-lg p-4">
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddClass(cls)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add All SKUs
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
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddSKU(sku)}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add SKU
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
          </CardContent>
        </Card>

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

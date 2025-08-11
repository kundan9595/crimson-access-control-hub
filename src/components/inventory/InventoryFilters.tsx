import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { toast } from 'sonner';

export interface InventoryFilterState {
  warehouse_id?: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  min_quantity?: number;
  max_quantity?: number;
  stock_status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  has_reservations?: boolean;
  date_from?: string;
  date_to?: string;
}

interface InventoryFiltersProps {
  filters: InventoryFilterState;
  onFiltersChange: (filters: InventoryFilterState) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; city?: string; state?: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load filter options
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      setLoadingOptions(true);
      
      // Load warehouses
      const warehousesData = await inventoryService.getWarehouses();
      setWarehouses(warehousesData || []);

      // Load other options from global inventory data
      const globalData = await inventoryService.getGlobalInventory({ limit: 1000 });
      const uniqueBrands = new Set<string>();
      const uniqueCategories = new Set<string>();
      const uniqueColors = new Set<string>();
      const uniqueSizes = new Set<string>();

      if (globalData && globalData.inventory && Array.isArray(globalData.inventory)) {
        globalData.inventory.forEach(item => {
          if (item?.sku?.class?.style?.brand?.name && typeof item.sku.class.style.brand.name === 'string') {
            uniqueBrands.add(item.sku.class.style.brand.name);
          }
          if (item?.sku?.class?.style?.category?.name && typeof item.sku.class.style.category.name === 'string') {
            uniqueCategories.add(item.sku.class.style.category.name);
          }
          if (item?.sku?.class?.color?.name && typeof item.sku.class.color.name === 'string') {
            uniqueColors.add(item.sku.class.color.name);
          }
          if (item?.sku?.size?.name && typeof item.sku.size.name === 'string') {
            uniqueSizes.add(item.sku.size.name);
          }
        });
      }

      setBrands(Array.from(uniqueBrands).sort());
      setCategories(Array.from(uniqueCategories).sort());
      setColors(Array.from(uniqueColors).sort());
      setSizes(Array.from(uniqueSizes).sort());
    } catch (error) {
      console.error('Error loading filter options:', error);
      toast.error('Failed to load filter options');
      // Set empty arrays as fallback
      setBrands([]);
      setCategories([]);
      setColors([]);
      setSizes([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const updateFilter = (key: keyof InventoryFilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilter = (key: keyof InventoryFilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof InventoryFilterState];
    return value !== undefined && value !== '' && value !== 'all';
  });

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof InventoryFilterState];
    return value !== undefined && value !== '' && value !== 'all';
  }).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Warehouse Filter */}
          <div className="space-y-2">
            <Label htmlFor="warehouse-filter">Warehouse</Label>
            <Select
              value={filters.warehouse_id || 'all'}
              onValueChange={(value) => updateFilter('warehouse_id', value === 'all' ? undefined : value)}
              disabled={loadingOptions}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                    {warehouse.city && ` (${warehouse.city}, ${warehouse.state})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <Label htmlFor="brand-filter">Brand</Label>
            <Select
              value={filters.brand || 'all'}
              onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}
              disabled={loadingOptions}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stock Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="stock-status-filter">Stock Status</Label>
            <Select
              value={filters.stock_status || 'all'}
              onValueChange={(value) => updateFilter('stock_status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Range */}
          <div className="space-y-2">
            <Label htmlFor="quantity-range">Quantity Range</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.min_quantity || ''}
                onChange={(e) => updateFilter('min_quantity', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.max_quantity || ''}
                onChange={(e) => updateFilter('max_quantity', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Filter */}
              <div className="space-y-2">
                <Label htmlFor="color-filter">Color</Label>
                <Select
                  value={filters.color || 'all'}
                  onValueChange={(value) => updateFilter('color', value === 'all' ? undefined : value)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size Filter */}
              <div className="space-y-2">
                <Label htmlFor="size-filter">Size</Label>
                <Select
                  value={filters.size || 'all'}
                  onValueChange={(value) => updateFilter('size', value === 'all' ? undefined : value)}
                  disabled={loadingOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sizes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Has Reservations Filter */}
              <div className="space-y-2">
                <Label htmlFor="reservations-filter">Reservations</Label>
                <Select
                  value={filters.has_reservations === undefined ? 'all' : filters.has_reservations ? 'yes' : 'no'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      clearFilter('has_reservations');
                    } else {
                      updateFilter('has_reservations', value === 'yes');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="yes">Has Reservations</SelectItem>
                    <SelectItem value="no">No Reservations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.date_from || ''}
                    onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
                    className="w-full"
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.date_to || ''}
                    onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined || value === '' || value === 'all') return null;
              
              let displayValue = value;
              if (key === 'warehouse_id') {
                const warehouse = warehouses.find(w => w.id === value);
                displayValue = warehouse?.name || value;
              } else if (key === 'has_reservations') {
                displayValue = value ? 'Has Reservations' : 'No Reservations';
              } else if (key === 'stock_status') {
                displayValue = value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              }

              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: {displayValue}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => clearFilter(key as keyof InventoryFilterState)}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryFilters;

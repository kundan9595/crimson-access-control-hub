import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, X, Package, Layers, Palette, Building2, Package as PackageIcon } from 'lucide-react';
import { InventoryViewType } from './types';
import { inventoryService } from '@/services/inventory/inventoryService';
import { toast } from 'sonner';

interface LocationData {
  warehouse_id: string;
  warehouse_name: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  locations: Array<{
    id: string;
    floor_name: string;
    lane_name: string;
    rack_name: string;
    quantity: number;
    sku_code?: string;
    size_name?: string;
    class_name?: string;
    style_name?: string;
  }>;
}

interface EnhancedInventoryLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewType: InventoryViewType;
  itemId: string;
  itemName: string;
  itemCode?: string; // SKU code, class name, or style name
}

const EnhancedInventoryLocationsModal: React.FC<EnhancedInventoryLocationsModalProps> = ({
  isOpen,
  onClose,
  viewType,
  itemId,
  itemName,
  itemCode
}) => {
  const [locationsData, setLocationsData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  const getViewTypeIcon = () => {
    switch (viewType) {
      case 'sku':
        return Package;
      case 'class':
        return Layers;
      case 'style':
        return Palette;
      default:
        return Package;
    }
  };

  const getViewTypeTitle = () => {
    switch (viewType) {
      case 'sku':
        return 'SKU Locations';
      case 'class':
        return 'Class Locations';
      case 'style':
        return 'Style Locations';
      default:
        return 'Locations';
    }
  };

  const getViewTypeSubtitle = () => {
    switch (viewType) {
      case 'sku':
        return `Viewing all warehouse locations for SKU: ${itemCode || itemName}`;
      case 'class':
        return `Viewing all warehouse locations for Class: ${itemCode || itemName}`;
      case 'style':
        return `Viewing all warehouse locations for Style: ${itemCode || itemName}`;
      default:
        return `Viewing all warehouse locations for: ${itemName}`;
    }
  };

  // Fetch locations data based on view type
  const fetchLocationsData = async () => {
    try {
      setLoading(true);
      let data: LocationData[] = [];

      switch (viewType) {
        case 'sku':
          // Use the existing SKU locations function
          const skuLocations = await inventoryService.getSkuLocationsByWarehouse(itemId);
          data = skuLocations;
          break;
        case 'class':
          // For now, use placeholder data. You'll need to create similar functions for class and style
          data = [
            {
              warehouse_id: '1',
              warehouse_name: 'Bangalore Tech Hub Warehouse',
              total_quantity: 150,
              reserved_quantity: 20,
              available_quantity: 130,
              locations: [
                {
                  id: '1',
                  floor_name: 'Floor 1',
                  lane_name: 'Lane A',
                  rack_name: 'Rack 1 (Left)',
                  quantity: 50,
                  class_name: itemName
                },
                {
                  id: '2',
                  floor_name: 'Floor 1',
                  lane_name: 'Lane B',
                  rack_name: 'Rack 2 (Right)',
                  quantity: 80,
                  class_name: itemName
                }
              ]
            },
            {
              warehouse_id: '2',
              warehouse_name: 'Delhi NCR Warehouse',
              total_quantity: 75,
              reserved_quantity: 10,
              available_quantity: 65,
              locations: [
                {
                  id: '3',
                  floor_name: 'Floor 2',
                  lane_name: 'Lane C',
                  rack_name: 'Rack 3 (Center)',
                  quantity: 75,
                  class_name: itemName
                }
              ]
            }
          ];
          break;
        case 'style':
          // For now, use placeholder data. You'll need to create similar functions for class and style
          data = [
            {
              warehouse_id: '1',
              warehouse_name: 'Bangalore Tech Hub Warehouse',
              total_quantity: 200,
              reserved_quantity: 30,
              available_quantity: 170,
              locations: [
                {
                  id: '1',
                  floor_name: 'Floor 1',
                  lane_name: 'Lane A',
                  rack_name: 'Rack 1 (Left)',
                  quantity: 100,
                  style_name: itemName
                },
                {
                  id: '2',
                  floor_name: 'Floor 1',
                  lane_name: 'Lane B',
                  rack_name: 'Rack 2 (Right)',
                  quantity: 100,
                  style_name: itemName
                }
              ]
            },
            {
              warehouse_id: '2',
              warehouse_name: 'Delhi NCR Warehouse',
              total_quantity: 120,
              reserved_quantity: 15,
              available_quantity: 105,
              locations: [
                {
                  id: '3',
                  floor_name: 'Floor 2',
                  lane_name: 'Lane C',
                  rack_name: 'Rack 3 (Center)',
                  quantity: 120,
                  style_name: itemName
                }
              ]
            }
          ];
          break;
      }

      setLocationsData(data);
      if (data.length > 0) {
        setActiveTab(data[0].warehouse_id);
      }
    } catch (error) {
      console.error('Error fetching locations data:', error);
      toast.error('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && itemId) {
      fetchLocationsData();
    }
  }, [isOpen, itemId, viewType]);

  const Icon = getViewTypeIcon();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {getViewTypeTitle()}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {getViewTypeSubtitle()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-4">
              <div className="flex space-x-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : locationsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Locations Found</h3>
              <p className="text-sm text-center">
                No warehouse locations found for this {viewType}.
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4 bg-gray-100 p-1 rounded-lg">
                {locationsData.map((warehouse) => (
                  <TabsTrigger
                    key={warehouse.warehouse_id}
                    value={warehouse.warehouse_id}
                    className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{warehouse.warehouse_name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {locationsData.map((warehouse) => (
                <TabsContent
                  key={warehouse.warehouse_id}
                  value={warehouse.warehouse_id}
                  className="flex-1 overflow-hidden"
                >
                  <div className="h-full flex flex-col">
                    {/* Warehouse Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{warehouse.warehouse_name}</h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <PackageIcon className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Total:</span>
                            <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                              {warehouse.total_quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-gray-600">Reserved:</span>
                            <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                              {warehouse.reserved_quantity}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-600">Available:</span>
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                              {warehouse.available_quantity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Locations Table */}
                    <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-700">Floor</TableHead>
                            <TableHead className="font-semibold text-gray-700">Lane</TableHead>
                            <TableHead className="font-semibold text-gray-700">Rack</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-center">Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {warehouse.locations.map((location, index) => (
                            <TableRow key={location.id || index} className="hover:bg-gray-50 border-b border-gray-100">
                              <TableCell className="text-gray-700">{location.floor_name}</TableCell>
                              <TableCell className="text-gray-700">{location.lane_name}</TableCell>
                              <TableCell className="text-gray-700">{location.rack_name}</TableCell>
                              <TableCell className="text-center">
                                <span className="font-semibold text-gray-900">{location.quantity}</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedInventoryLocationsModal;

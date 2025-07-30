import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  MapPin,
  Package,
  Calendar,
  ArrowLeft,
  ArrowRight,
  X,
  Settings
} from 'lucide-react';

interface ViewWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: any;
}

const ViewWarehouseDialog: React.FC<ViewWarehouseDialogProps> = ({
  open,
  onOpenChange,
  warehouse
}) => {
  if (!warehouse) return null;

  const getTotalRacks = (floor: any): number => {
    if (!floor.lanes || !Array.isArray(floor.lanes)) return 0;
    return floor.lanes.reduce((total: number, lane: any) => {
      return total + (lane.racks?.length || 0);
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {warehouse.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Warehouse Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Floors</p>
                    <p className="font-semibold">{warehouse.floors_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Lanes</p>
                    <p className="font-semibold">{warehouse.lanes_count || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Racks</p>
                    <p className="font-semibold">
                      {warehouse.floors?.reduce((total: number, floor: any) =>
                        total + getTotalRacks(floor), 0
                      ) || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold text-sm">
                      {warehouse.created_at ? formatDate(warehouse.created_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(warehouse.status || 'active')}>
                  {warehouse.status || 'Active'}
                </Badge>
                {warehouse.city && warehouse.state && (
                  <span className="text-sm text-gray-600">
                    📍 {warehouse.city}, {warehouse.state}
                  </span>
                )}
              </div>

              {warehouse.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-sm">{warehouse.description}</p>
                </div>
              )}

              {warehouse.address && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-sm">{warehouse.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Structure */}
          <Tabs defaultValue="floors" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="floors">Floors & Lanes</TabsTrigger>
              <TabsTrigger value="racks">Rack Details</TabsTrigger>
            </TabsList>

            <TabsContent value="floors" className="space-y-4">
              {warehouse.floors && warehouse.floors.length > 0 ? (
                warehouse.floors.map((floor: any, floorIndex: number) => (
                  <Card key={floor.id || floorIndex}>
                    <CardHeader>
                      <CardTitle className="text-md flex items-center justify-between">
                        <span>Floor {floor.floor_number || floorIndex + 1}: {floor.name}</span>
                        <Badge variant="outline">
                          {floor.lanes?.length || 0} Lanes
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {floor.lanes && floor.lanes.length > 0 ? (
                        <div className="space-y-3">
                          {floor.lanes.map((lane: any, laneIndex: number) => (
                            <div key={lane.id || laneIndex} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">
                                  Lane {lane.lane_number || laneIndex + 1}: {lane.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {lane.racks?.length || 0} Racks
                                  </Badge>
                                  {lane.config && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <span>Default:</span>
                                      {lane.config.default_direction === 'left' ? (
                                        <ArrowLeft className="w-3 h-3" />
                                      ) : (
                                        <ArrowRight className="w-3 h-3" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {lane.config && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>Left Side:</span>
                                    <Badge variant={lane.config.left_side_enabled ? 'default' : 'secondary'}>
                                      {lane.config.left_side_enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                    {lane.config.left_side_enabled && (
                                      <span className="text-gray-600">
                                        ({lane.config.default_left_racks || 4} racks)
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span>Right Side:</span>
                                    <Badge variant={lane.config.right_side_enabled ? 'default' : 'secondary'}>
                                      {lane.config.right_side_enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                    {lane.config.right_side_enabled && (
                                      <span className="text-gray-600">
                                        ({lane.config.default_right_racks || 4} racks)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No lanes configured</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-gray-500 text-center">No floors configured</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="racks" className="space-y-4">
              {warehouse.floors && warehouse.floors.length > 0 ? (
                warehouse.floors.map((floor: any, floorIndex: number) => (
                  <Card key={floor.id || floorIndex}>
                    <CardHeader>
                      <CardTitle className="text-md">Floor {floor.floor_number || floorIndex + 1}: {floor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {floor.lanes && floor.lanes.length > 0 ? (
                        <div className="space-y-4">
                          {floor.lanes.map((lane: any, laneIndex: number) => (
                            <div key={lane.id || laneIndex} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-3">
                                Lane {lane.lane_number || laneIndex + 1}: {lane.name}
                              </h4>

                              {lane.racks && lane.racks.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left Side Racks */}
                                  {lane.config?.left_side_enabled && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                        <ArrowLeft className="w-3 h-3" />
                                        Left Side
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {lane.racks
                                          .filter((rack: any) => rack.side === 'left')
                                          .map((rack: any, rackIndex: number) => (
                                            <div key={rack.id || rackIndex} className="bg-gray-50 p-2 rounded text-center text-sm">
                                              {rack.rack_name || `Rack ${rack.rack_number || rackIndex + 1}`}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Right Side Racks */}
                                  {lane.config?.right_side_enabled && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        Right Side
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {lane.racks
                                          .filter((rack: any) => rack.side === 'right')
                                          .map((rack: any, rackIndex: number) => (
                                            <div key={rack.id || rackIndex} className="bg-gray-50 p-2 rounded text-center text-sm">
                                              {rack.rack_name || `Rack ${rack.rack_number || rackIndex + 1}`}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No racks configured</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No lanes configured</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-gray-500 text-center">No floors configured</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewWarehouseDialog; 
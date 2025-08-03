import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  MapPin,
  Calendar,
  Star,
  StarOff,
  User
} from 'lucide-react';
import { type Warehouse } from '@/services/warehouseServiceOptimized';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onView: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onSetPrimary?: (warehouse: Warehouse) => void;
  loading?: boolean;
}

const WarehouseCard: React.FC<WarehouseCardProps> = memo(({
  warehouse,
  onView,
  onEdit,
  onDelete,
  onSetPrimary,
  loading = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if primary warehouse feature is available
  const isPrimaryFeatureAvailable = warehouse.hasOwnProperty('is_primary');
  const isPrimary = warehouse.is_primary === true;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <Badge className={`w-fit ${getStatusColor(warehouse.status)}`}>
              {warehouse.status}
            </Badge>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold truncate">
                {warehouse.name}
              </CardTitle>
              {isPrimaryFeatureAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetPrimary?.(warehouse)}
                  disabled={loading}
                  className="p-1 h-auto text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  title={isPrimary ? "Primary Warehouse" : "Set as Primary"}
                >
                  <Star className={`h-4 w-4 ${isPrimary ? 'fill-current' : ''}`} />
                </Button>
              )}
              {warehouse.warehouse_admin_id && (
                <div className="p-1 text-green-600" title="Has Warehouse Admin">
                  <div className="relative">
                    <User className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location */}
        {warehouse.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {warehouse.city}
              {warehouse.state && `, ${warehouse.state}`}
            </span>
          </div>
        )}

        {/* Description */}
        {warehouse.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {warehouse.description}
          </p>
        )}

        {/* Status and Location Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>{warehouse.city || 'No location'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(warehouse.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(warehouse)}
            disabled={loading}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(warehouse)}
            disabled={loading}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(warehouse)}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

WarehouseCard.displayName = 'WarehouseCard';

export default WarehouseCard; 
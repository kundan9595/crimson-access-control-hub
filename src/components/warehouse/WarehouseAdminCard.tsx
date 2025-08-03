import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Users, AlertTriangle, CheckCircle, UserX } from 'lucide-react';
import { fetchWarehouseAdmins } from '@/services/usersService';
import type { Profile } from '@/services/usersService';

interface WarehouseAdminCardProps {
  warehouseId: string;
  warehouseName: string;
  currentAdminId?: string | null;
  onAppointAdmin: () => void;
}

const WarehouseAdminCard: React.FC<WarehouseAdminCardProps> = ({
  warehouseId,
  warehouseName,
  currentAdminId,
  onAppointAdmin
}) => {
  const [warehouseAdmins, setWarehouseAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouseAdmins();
  }, []);

  const loadWarehouseAdmins = async () => {
    try {
      setLoading(true);
      const admins = await fetchWarehouseAdmins();
      setWarehouseAdmins(admins);
    } catch (error) {
      console.error('Error fetching warehouse admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAdmin = () => {
    if (!currentAdminId || !warehouseAdmins.length) return null;
    return warehouseAdmins.find(admin => admin.id === currentAdminId);
  };

  const currentAdmin = getCurrentAdmin();

  if (!currentAdminId) {
    return (
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
            <Users className="h-5 w-5" />
            Warehouse Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-orange-100 rounded-lg border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 mb-1">No Admin Appointed</h4>
                <p className="text-sm text-orange-700 mb-3">
                  This warehouse currently has no appointed administrator. Appoint an admin to manage warehouse operations.
                </p>
                <Button 
                  onClick={onAppointAdmin}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Appoint Admin
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-green-200 bg-green-50/20 animate-in slide-in-from-right duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-green-800">
          <Users className="h-5 w-5" />
          Warehouse Admin
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentAdmin ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-100 rounded-lg border border-green-200 hover:bg-green-150 transition-colors duration-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-green-900 truncate">
                    {currentAdmin.first_name} {currentAdmin.last_name}
                  </h4>
                  <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="font-medium">Email:</span>
                    <span className="truncate">{currentAdmin.email}</span>
                  </div>
                  {currentAdmin.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span className="font-medium">Phone:</span>
                      <span>{currentAdmin.phone_number}</span>
                    </div>
                  )}
                  {currentAdmin.department && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span className="font-medium">Dept:</span>
                      <span className="capitalize">{currentAdmin.department.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={onAppointAdmin}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
              >
                <Users className="h-4 w-4 mr-2" />
                Change Admin
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-100 rounded-lg border border-red-200">
              <UserX className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Admin Not Found</h4>
                <p className="text-sm text-red-700 mb-3">
                  The appointed admin may have been deleted or is no longer available.
                </p>
                <Button 
                  onClick={onAppointAdmin}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Appoint New Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WarehouseAdminCard; 
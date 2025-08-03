import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Users, AlertTriangle, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWarehouseAdmins } from '@/services/usersService';
import { warehouseServiceOptimized } from '@/services/warehouseServiceOptimized';
import type { Profile } from '@/services/usersService';

interface AppointWarehouseAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName: string;
  currentAdminId?: string | null;
  onSuccess?: () => void;
}

const AppointWarehouseAdminDialog: React.FC<AppointWarehouseAdminDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  currentAdminId,
  onSuccess
}) => {
  const [warehouseAdmins, setWarehouseAdmins] = useState<Profile[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingAdmins, setFetchingAdmins] = useState(false);

  // Fetch warehouse admins when dialog opens
  useEffect(() => {
    if (open) {
      loadWarehouseAdmins();
      setSelectedAdminId(currentAdminId || '');
    }
  }, [open, currentAdminId]);

  const loadWarehouseAdmins = async () => {
    try {
      setFetchingAdmins(true);
      const admins = await fetchWarehouseAdmins();
      setWarehouseAdmins(admins);
    } catch (error) {
      console.error('Error fetching warehouse admins:', error);
      toast.error('Failed to fetch warehouse admins');
    } finally {
      setFetchingAdmins(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAdminId) {
      toast.error('Please select a warehouse admin');
      return;
    }

    try {
      setLoading(true);
      await warehouseServiceOptimized.updateWarehouseAdmin(warehouseId, selectedAdminId);
      
      const selectedAdmin = warehouseAdmins.find(admin => admin.id === selectedAdminId);
      toast.success(`Successfully appointed ${selectedAdmin?.first_name} ${selectedAdmin?.last_name} as warehouse admin`);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error appointing warehouse admin:', error);
      toast.error('Failed to appoint warehouse admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async () => {
    try {
      setLoading(true);
      await warehouseServiceOptimized.updateWarehouseAdmin(warehouseId, null);
      
      toast.success('Warehouse admin removed successfully');
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing warehouse admin:', error);
      toast.error('Failed to remove warehouse admin');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAdminName = () => {
    if (!currentAdminId) return null;
    const admin = warehouseAdmins.find(a => a.id === currentAdminId);
    return admin ? `${admin.first_name} ${admin.last_name}` : 'Unknown Admin';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            Appoint Warehouse Admin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Warehouse</span>
            </div>
            <p className="text-blue-800 font-semibold">{warehouseName}</p>
            {currentAdminId && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Current Admin</span>
                </div>
                <p className="text-green-800">{getCurrentAdminName()}</p>
              </div>
            )}
          </div>

          {warehouseAdmins.length === 0 && !fetchingAdmins ? (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">No Warehouse Admins Available</h4>
                  <p className="text-sm text-amber-700">
                    No users with warehouse admin roles found. Please create users with warehouse admin roles first.
                  </p>
                </div>
              </div>
            </div>
          ) : fetchingAdmins ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <div className="text-sm text-gray-600">Loading warehouse admins...</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Select Warehouse Admin
                </label>
                <Select
                  value={selectedAdminId}
                  onValueChange={setSelectedAdminId}
                  disabled={fetchingAdmins}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={fetchingAdmins ? "Loading..." : "Choose a warehouse admin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {admin.first_name} {admin.last_name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {admin.email}
                            </div>
                            {admin.department && (
                              <div className="text-xs text-gray-400 capitalize">
                                {admin.department.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={loading || !selectedAdminId || fetchingAdmins}
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Appointing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Appoint Admin
                    </>
                  )}
                </Button>
                
                {currentAdminId && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveAdmin}
                    disabled={loading || fetchingAdmins}
                    className="h-11 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointWarehouseAdminDialog; 
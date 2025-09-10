import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, 
  Upload, 
  Download, 
  Plus,
  Eye,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { purchaseOrderService, PurchaseOrder } from '@/services/purchaseOrderService';
import { PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_VARIANTS } from '@/types/purchaseOrder';
import { toast } from 'sonner';
import CreatePOModal from './CreatePOModal';
import PurchaseOrderViewModal from './PurchaseOrderViewModal';
import { usePurchaseOrderBalance } from '@/hooks/usePurchaseOrderBalance';

type PurchaseOrderViewType = 'basic' | 'balance';

const PurchaseOrderTab: React.FC = () => {
  const [currentView, setCurrentView] = useState<PurchaseOrderViewType>('basic');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    vendor: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Balance view hook
  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
    refresh: refreshBalanceData
  } = usePurchaseOrderBalance();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const orders = await purchaseOrderService.getPurchaseOrders();
      setPurchaseOrders(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewPO = (poId: string) => {
    setSelectedPOId(poId);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPOId(null);
  };

  const handleEditDraft = (poId: string) => {
    setEditingDraftId(poId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDraftId(null);
  };

  const handleDeleteDraft = (poId: string) => {
    setDeletingDraftId(poId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDraft = async () => {
    if (!deletingDraftId) return;
    
    try {
      await purchaseOrderService.deleteDraft(deletingDraftId);
      toast.success('Purchase order deleted successfully');
      fetchPurchaseOrders(); // Refresh the table
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error('Failed to delete purchase order');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingDraftId(null);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    return (
      <Badge variant={PURCHASE_ORDER_STATUS_VARIANTS[status]}>
        {PURCHASE_ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as PurchaseOrderViewType)}>
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="basic" className="px-3 py-2">Basic View</TabsTrigger>
          <TabsTrigger value="balance" className="px-3 py-2">Balance View</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {/* Create PO Button */}
          <div className="flex justify-end">
            <Button onClick={handleCreatePO} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </Button>
          </div>

          {/* Purchase Orders Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">Loading purchase orders...</div>
                      </TableCell>
                    </TableRow>
                  ) : purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">No purchase orders found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">
                          {po.po_number}
                        </TableCell>
                        <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{po.vendor_name}</p>
                            <p className="text-sm text-muted-foreground">{po.vendor_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{po.item_count}</TableCell>
                        <TableCell className="font-medium">₹{po.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewPO(po.id)}
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {po.status === 'draft' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditDraft(po.id)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {(po.status === 'draft' || po.status === 'sent_for_approval') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteDraft(po.id)}
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">

          {/* Balance View Table */}
          <Card>
            <CardContent className="p-0">
              {balanceLoading ? (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-muted-foreground">Loading balance view data...</span>
                  </div>
                </div>
              ) : balanceError ? (
                <div className="p-8 text-center">
                  <div className="text-destructive mb-2">Error loading balance data</div>
                  <div className="text-sm text-muted-foreground mb-4">{balanceError}</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshBalanceData}
                  >
                    Retry
                  </Button>
                </div>
              ) : balanceData && balanceData.sizes.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                          Class Name
                        </TableHead>
                        {balanceData.sizes.map((size) => (
                          <TableHead key={size} className="text-center min-w-[80px]">
                            Size {size}
                          </TableHead>
                        ))}
                        <TableHead className="min-w-[300px]">
                          Vendor Breakdown
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(balanceData.data)
                        .map((classId) => {
                        const className = balanceData.classIdToName[classId];
                        const classData = balanceData.data[classId];
                        
                        // Get all vendors for this class across all sizes
                        const allVendors = Object.values(classData)
                          .filter(sizeData => sizeData.quantity > 0)
                          .flatMap(sizeData => sizeData.vendors);
                        
                        // Aggregate vendors by vendor_id to avoid duplicates
                        const vendorMap = new Map();
                        allVendors.forEach(vendor => {
                          if (vendorMap.has(vendor.vendor_id)) {
                            const existing = vendorMap.get(vendor.vendor_id);
                            vendorMap.set(vendor.vendor_id, {
                              ...vendor,
                              quantity: existing.quantity + vendor.quantity,
                              percentage: Math.round((existing.quantity + vendor.quantity) / 
                                allVendors.reduce((sum, v) => sum + v.quantity, 0) * 100 * 10) / 10
                            });
                          } else {
                            vendorMap.set(vendor.vendor_id, vendor);
                          }
                        });
                        
                        const aggregatedVendors = Array.from(vendorMap.values());
                        
                        return (
                          <TableRow key={classId}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10">
                              {className}
                            </TableCell>
                            {balanceData.sizes.map((sizeName) => {
                              // Find the size data for this size name
                              const sizeData = Object.entries(classData).find(([sizeId, data]) => 
                                balanceData.sizeIdToName[sizeId] === sizeName
                              );
                              
                              const quantity = sizeData ? sizeData[1].quantity : 0;
                              
                              return (
                                <TableCell key={sizeName} className="text-center">
                                  {quantity > 0 ? (
                                    <span className="font-medium text-primary">
                                      {quantity.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              {aggregatedVendors.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {aggregatedVendors.map((vendor, index) => (
                                    <Badge 
                                      key={`${classId}-${vendor.vendor_id}-${index}`} 
                                      variant={vendor.percentage > 50 ? 'secondary' : 'outline'} 
                                      className="text-xs"
                                    >
                                      {vendor.vendor_name}: {vendor.quantity.toLocaleString()} ({vendor.percentage}%)
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No vendor data</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : balanceData && balanceData.sizes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-muted-foreground mb-2">No purchase order data available for balance view</div>
                  <p className="text-sm text-muted-foreground">
                    Create purchase orders with "sent_to_vendor" status to see the balance view data
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-muted-foreground">No balance view data available</div>
                </div>
              )}
            </CardContent>
          </Card>


        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchPurchaseOrders();
          toast.success('Purchase order created successfully');
        }}
        onDraftSaved={() => {
          fetchPurchaseOrders(); // Refresh table when draft is saved
        }}
      />

      <PurchaseOrderViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        poId={selectedPOId}
        onRefresh={fetchPurchaseOrders}
      />

      {/* Edit Draft Modal */}
      <CreatePOModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingDraftId(null);
          fetchPurchaseOrders();
          toast.success('Draft updated successfully');
        }}
        onDraftSaved={() => {
          fetchPurchaseOrders(); // Refresh table when draft is saved
        }}
        editingDraftId={editingDraftId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase order? This action cannot be undone.
              <br />
              <br />
              <strong>Purchase Order:</strong> {(() => {
                const po = purchaseOrders.find(po => po.id === deletingDraftId);
                if (po?.status === 'sent_for_approval') {
                  return `${po.po_number} (Sent for Approval)`;
                }
                return po?.po_number || 'Unknown';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingDraftId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseOrderTab;

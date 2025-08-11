import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Eye, 
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  Building2
} from 'lucide-react';
import { purchaseOrderService, PurchaseOrder } from '@/services/purchaseOrderService';
import { PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_VARIANTS } from '@/types/purchaseOrder';
import { toast } from 'sonner';
import CreatePOModal from '@/components/inbound/CreatePOModal';
import PurchaseOrderViewModal from '@/components/inbound/PurchaseOrderViewModal';

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

  const handleRefresh = () => {
    fetchPurchaseOrders();
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    return (
      <Badge variant={PURCHASE_ORDER_STATUS_VARIANTS[status]}>
        {PURCHASE_ORDER_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === 'all' || order.status === statusFilter;
    const matchesVendor = !vendorFilter || vendorFilter === 'all' || order.vendor_id === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const getStatusCounts = () => {
    const counts = {
      draft: 0,
      sent_for_approval: 0,
      approved: 0,
      rejected: 0,
      sent_to_vendor: 0,
      completed: 0,
      cancelled: 0
    };

    purchaseOrders.forEach(order => {
      counts[order.status as keyof typeof counts]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage and track purchase orders</p>
        </div>
        <Button onClick={handleCreatePO} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total POs</p>
                <p className="text-2xl font-bold">{purchaseOrders.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{statusCounts.draft}</p>
              </div>
              <Badge variant="secondary">{statusCounts.draft}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{statusCounts.sent_for_approval}</p>
              </div>
              <Badge variant="default">{statusCounts.sent_for_approval}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
              </div>
              <Badge variant="default">{statusCounts.approved}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search PO number or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                 ))}
               </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading purchase orders...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No purchase orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first purchase order'}
              </p>
              {!searchTerm && !statusFilter && (
                <Button onClick={handleCreatePO} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Purchase Order
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.po_number}</TableCell>
                                            <TableCell>
                          <div>
                            <p className="font-medium">{order.vendor_name}</p>
                            <p className="text-sm text-muted-foreground">{order.vendor_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.item_count}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="font-medium">₹{order.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPO(order.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchPurchaseOrders();
          toast.success('Purchase order created successfully');
        }}
      />

      <PurchaseOrderViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        poId={selectedPOId}
        onRefresh={fetchPurchaseOrders}
      />
    </div>
  );
};

export default PurchaseOrders;

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Upload, 
  Download, 
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import { purchaseOrderService, PurchaseOrder } from '@/services/purchaseOrderService';
import { PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABELS, PURCHASE_ORDER_STATUS_VARIANTS } from '@/types/purchaseOrder';
import { toast } from 'sonner';
import CreatePOModal from './CreatePOModal';
import PurchaseOrderViewModal from './PurchaseOrderViewModal';

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
          {/* Filters and Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filters & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([status, label]) => (
                        <SelectItem key={status} value={status}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-filter" className="text-sm font-medium">Vendor</Label>
                  <Select value={filters.vendor} onValueChange={(value) => setFilters({...filters, vendor: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      <SelectItem value="vendor-a">Vendor A</SelectItem>
                      <SelectItem value="vendor-b">Vendor B</SelectItem>
                      <SelectItem value="vendor-c">Vendor C</SelectItem>
                      <SelectItem value="vendor-d">Vendor D</SelectItem>
                      <SelectItem value="vendor-e">Vendor E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-from" className="text-sm font-medium">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to" className="text-sm font-medium">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search purchase orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchPurchaseOrders}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <Button onClick={handleCreatePO} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Purchase Order
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        <TableCell className="font-medium">{po.po_number}</TableCell>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPO(po.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
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
          {/* Balance View Content */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Balance View Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>28</TableHead>
                    <TableHead>32</TableHead>
                    <TableHead>L</TableHead>
                    <TableHead>M</TableHead>
                    <TableHead>S</TableHead>
                    <TableHead>Vendors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Class 3</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>9</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Vendor B: 19 (90.5%)</Badge>
                        <Badge variant="outline" className="text-xs">Vendor C: 2 (9.5%)</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Class 2</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Vendor B: 8 (100.0%)</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Class 4</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>15</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Vendor B: 10 (66.7%)</Badge>
                        <Badge variant="outline" className="text-xs">Vendor C: 5 (33.3%)</Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Class 7</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>4</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Vendor C: 4 (100.0%)</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Class 8</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>6</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Vendor C: 6 (100.0%)</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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

export default PurchaseOrderTab;

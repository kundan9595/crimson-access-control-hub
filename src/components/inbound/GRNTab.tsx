import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GRNModal from './GRNModal';
import PurchaseOrderViewModal from './PurchaseOrderViewModal';
import { useGRNData } from '@/hooks/useGRNData';

const GRNTab: React.FC = () => {
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<{
    id: string;
    po_number: string;
    vendor_name: string;
  } | null>(null);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);

  const { grnEntries, loading, error, refetch } = useGRNData();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'partially_received': { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800' },
      'sent_to_vendor': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      'received': { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['sent_to_vendor'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const handleGRNClick = (entry: any) => {
    setSelectedPO({
      id: entry.id,
      po_number: entry.po_number,
      vendor_name: entry.vendor_name
    });
    setIsGRNModalOpen(true);
  };

  const handlePOClick = (poId: string) => {
    setSelectedPOId(poId);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPOId(null);
  };

  return (
    <div className="space-y-4">


      {/* GRN Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>GRN Ratio</TableHead>
                <TableHead>QC %</TableHead>
                <TableHead>Put Away</TableHead>
                <TableHead>R2V:Accept</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">Loading GRN data...</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-destructive">Error loading data: {error}</div>
                  </TableCell>
                </TableRow>
              ) : grnEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">No GRN entries found</div>
                  </TableCell>
                </TableRow>
              ) : (
                grnEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handlePOClick(entry.id)}
                        className="text-primary hover:text-primary/80 hover:underline cursor-pointer"
                      >
                        {entry.po_number}
                      </button>
                    </TableCell>
                    <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.vendor_name}</TableCell>
                    <TableCell>{entry.items}</TableCell>
                    <TableCell>{entry.grn_ratio}</TableCell>
                    <TableCell>{entry.qc_percentage}</TableCell>
                    <TableCell>{entry.put_away}</TableCell>
                    <TableCell>{entry.r2v_accept}</TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGRNClick(entry)}
                        >
                          GRN
                        </Button>
                        <Button variant="outline" size="sm">
                          Put Away
                        </Button>
                        <Button variant="outline" size="sm">
                          Return
                        </Button>
                        <Button variant="outline" size="sm">
                          QC
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GRN Modal */}
      {selectedPO && (
        <GRNModal
          isOpen={isGRNModalOpen}
          onClose={() => {
            setIsGRNModalOpen(false);
            setSelectedPO(null);
          }}
          poId={selectedPO.id}
          poNumber={selectedPO.po_number}
          vendorName={selectedPO.vendor_name}
          onRefresh={refetch}
        />
      )}

      {/* Purchase Order View Modal */}
      <PurchaseOrderViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        poId={selectedPOId}
        onRefresh={refetch}
      />
    </div>
  );
};

export default GRNTab;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GRNTab: React.FC = () => {
  // Mock data for GRN entries
  const grnEntries = [
    {
      poNumber: 'PO-2024-001',
      date: '10/08/2025',
      vendor: 'Vendor A',
      items: 2,
      grnRatio: '130:20',
      qcPercentage: '-',
      putAway: '-',
      r2vAccept: '-',
      status: 'Partially Received'
    },
    {
      poNumber: 'PO-2024-002',
      date: '10/08/2025',
      vendor: 'Vendor B',
      items: 1,
      grnRatio: '60:15',
      qcPercentage: '-',
      putAway: '-',
      r2vAccept: '-',
      status: 'Sent'
    },
    {
      poNumber: 'PO-2024-003',
      date: '10/08/2025',
      vendor: 'Vendor A',
      items: 1,
      grnRatio: '200:0',
      qcPercentage: '-',
      putAway: '-',
      r2vAccept: '-',
      status: 'Received'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Partially Received': { variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800' },
      'Sent': { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      'Received': { variant: 'secondary' as const, className: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Sent'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">GRN</h2>
      </div>

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
              {grnEntries.map((entry) => (
                <TableRow key={entry.poNumber}>
                  <TableCell className="font-medium">{entry.poNumber}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.vendor}</TableCell>
                  <TableCell>{entry.items}</TableCell>
                  <TableCell>{entry.grnRatio}</TableCell>
                  <TableCell>{entry.qcPercentage}</TableCell>
                  <TableCell>{entry.putAway}</TableCell>
                  <TableCell>{entry.r2vAccept}</TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GRNTab;

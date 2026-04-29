import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Download, Eye, FileText, Tag, ArrowLeft } from 'lucide-react';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import ReportDownloadModal from '@/components/reports/ReportDownloadModal';
import {
  useRmpOrderReports,
  type RmpOrderReport,
} from '@/hooks/reports/useRmpOrderReports';
import { fetchRmpOrderReports } from '@/services/reports/rmpOrderReportsService';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';

const RmpOrderReportsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const filters = searchTerm ? { search: searchTerm } : undefined;

  const { data: reportsPage, isLoading, isFetching } = useRmpOrderReports(page, pageSize, filters);

  const reports = reportsPage?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleDownloadAll = async () => {
    setDownloadModalOpen(true);
  };

  const handleExportCurrent = async () => {
    if (!reports.length) return;

    exportToCSV({
      filename: generateExportFilename('rmp-order-reports'),
      headers: [
        'Order ID',
        'Order Number',
        'Customer',
        'Customer Code',
        'SKU ID',
        'SKU Name',
        'Quantity',
        'Price',
        'Status',
        'Created',
      ],
      data: reports,
      fieldMap: {
        'Order ID': 'order_id',
        'Order Number': 'order_number',
        'Customer': 'customer_name',
        'Customer Code': 'customer_code',
        'SKU ID': 'rmp_sku_id',
        'SKU Name': 'rmp_sku_name',
        'Quantity': (item: RmpOrderReport) => String(item.quantity ?? 0),
        'Price': (item: RmpOrderReport) =>
          item.price ? `₹${item.price.toFixed(2)}` : '-',
        'Status': 'status',
        'Created': (item: RmpOrderReport) =>
          new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const handleDownloadWithFilters = async (filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    const serviceFilters = {
      start_date: filters.startDate,
      end_date: filters.endDate,
      status: filters.status,
    };
    return fetchRmpOrderReports(serviceFilters);
  };

  const totalCount = reportsPage?.totalCount ?? reports.length;
  const totalQuantity = reports.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalValue = reports.reduce((sum, r) => sum + (r.price || 0) * (r.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">RMP Order Reports</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Scott API
                </Badge>
              </div>
              <p className="text-muted-foreground">
                View and download Ready Made Product order reports
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCurrent} disabled={!reports.length}>
              <Download className="h-4 w-4 mr-2" />
              Export Current
            </Button>
            <Button size="sm" onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Tag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search RMP orders..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={reports.length}
            totalCount={totalCount}
          />

          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={9} className="mt-6" />
          ) : reports.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 mt-6">
              <p>{searchTerm ? 'No RMP orders match your search' : 'No RMP orders found'}</p>
            </div>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>SKU Name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.order_id || '-'}</TableCell>
                    <TableCell>{report.order_number || '-'}</TableCell>
                    <TableCell>{report.customer_name || '-'}</TableCell>
                    <TableCell>{report.rmp_sku_id || '-'}</TableCell>
                    <TableCell>{report.rmp_sku_name || '-'}</TableCell>
                    <TableCell>{report.quantity ?? '-'}</TableCell>
                    <TableCell>{report.price ? `₹${report.price.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                        {report.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCurrent()}
                        title="Export row"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <MasterServerPagination
            result={reportsPage ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isLoading || isFetching}
            className="mt-6"
          />
        </CardContent>
      </Card>

      <ReportDownloadModal
        open={downloadModalOpen}
        onOpenChange={setDownloadModalOpen}
        title="RMP Order Reports"
        onDownload={handleDownloadWithFilters}
        headers={[
          'Order ID',
          'Order Number',
          'Customer',
          'Customer Code',
          'SKU ID',
          'SKU Name',
          'Quantity',
          'Price',
          'Status',
          'Created',
        ]}
        fieldMap={{
          'Order ID': 'order_id',
          'Order Number': 'order_number',
          'Customer': 'customer_name',
          'Customer Code': 'customer_code',
          'SKU ID': 'rmp_sku_id',
          'SKU Name': 'rmp_sku_name',
          'Quantity': (item: RmpOrderReport) => String((item as RmpOrderReport).quantity ?? 0),
          'Price': (item: RmpOrderReport) =>
            (item as RmpOrderReport).price ? `₹${(item as RmpOrderReport).price!.toFixed(2)}` : '-',
          'Status': 'status',
          'Created': (item: RmpOrderReport) =>
            new Date((item as RmpOrderReport).created_at).toLocaleDateString(),
        }}
        entityName="rmp-order-reports"
        showStatusFilter={true}
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
          { value: 'completed', label: 'Completed' },
        ]}
      />
    </div>
  );
};

export default RmpOrderReportsPage;

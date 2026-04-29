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
import { ShoppingCart, Download, Eye, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import ReportDownloadModal from '@/components/reports/ReportDownloadModal';
import {
  useOrderReports,
  useAllOrderReports,
  type OrderReport,
} from '@/hooks/reports/useOrderReports';
import { fetchOrderReports } from '@/services/reports/orderReportsService';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';

const OrderReportsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const filters = searchTerm ? { search: searchTerm } : undefined;

  const { data: reportsPage, isLoading, isFetching } = useOrderReports(page, pageSize, filters);
  const { data: allReports } = useAllOrderReports();

  const reports = reportsPage?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleView = (report: OrderReport) => {
    navigate(`/reports/order-reports/${report.id}`);
  };

  const handleDownloadAll = async () => {
    setDownloadModalOpen(true);
  };

  const handleExportCurrent = async () => {
    if (!reports.length) return;

    exportToCSV({
      filename: generateExportFilename('custom-order-reports'),
      headers: ['Order ID', 'Order Number', 'Customer', 'Customer Code', 'Date', 'Amount', 'Status', 'Created'],
      data: reports,
      fieldMap: {
        'Order ID': 'order_id',
        'Order Number': 'order_number',
        'Customer': 'customer_name',
        'Customer Code': 'customer_code',
        'Date': (item: OrderReport) =>
          item.order_date ? new Date(item.order_date).toLocaleDateString() : '-',
        'Amount': (item: OrderReport) =>
          item.total_amount ? `₹${item.total_amount.toFixed(2)}` : '-',
        'Status': 'status',
        'Created': (item: OrderReport) =>
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
    return fetchOrderReports(serviceFilters);
  };

  const totalCount = reportsPage?.totalCount ?? reports.length;
  const totalAmount = reports.reduce((sum, r) => sum + (r.total_amount || 0), 0);

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
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Custom Order Reports</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Scott API
                </Badge>
              </div>
              <p className="text-muted-foreground">
                View and download custom product order reports
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
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Orders</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Page Amount</p>
              <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search orders..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={reports.length}
            totalCount={totalCount}
          />

          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={8} className="mt-6" />
          ) : reports.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 mt-6">
              <p>{searchTerm ? 'No orders match your search' : 'No orders found'}</p>
            </div>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
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
                    <TableCell>{report.customer_code || '-'}</TableCell>
                    <TableCell>
                      {report.order_date
                        ? new Date(report.order_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {report.total_amount ? `₹${report.total_amount.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                        {report.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(report)}>
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
        title="Custom Order Reports"
        onDownload={handleDownloadWithFilters}
        headers={['Order ID', 'Order Number', 'Customer', 'Customer Code', 'Date', 'Amount', 'Status', 'Created']}
        fieldMap={{
          'Order ID': 'order_id',
          'Order Number': 'order_number',
          'Customer': 'customer_name',
          'Customer Code': 'customer_code',
          'Date': (item: OrderReport) =>
            (item as OrderReport).order_date
              ? new Date((item as OrderReport).order_date!).toLocaleDateString()
              : '-',
          'Amount': (item: OrderReport) =>
            (item as OrderReport).total_amount
              ? `₹${(item as OrderReport).total_amount!.toFixed(2)}`
              : '-',
          'Status': 'status',
          'Created': (item: OrderReport) =>
            new Date((item as OrderReport).created_at).toLocaleDateString(),
        }}
        entityName="custom-order-reports"
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

export default OrderReportsPage;

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
import { Scissors, Download, Eye, Users, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import ReportDownloadModal from '@/components/reports/ReportDownloadModal';
import {
  useTailorReports,
  type TailorReport,
} from '@/hooks/reports/useTailorReports';
import { fetchTailorReports } from '@/services/reports/tailorReportsService';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';

const TailorReportsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const filters = searchTerm ? { search: searchTerm } : undefined;

  const { data: reportsPage, isLoading, isFetching } = useTailorReports(page, pageSize, filters);

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
      filename: generateExportFilename('tailor-reports'),
      headers: [
        'Tailor ID',
        'Tailor Name',
        'Tailor Code',
        'Order ID',
        'Order Number',
        'Assigned Date',
        'Completion Date',
        'Items Count',
        'Total Value',
        'Status',
        'Created',
      ],
      data: reports,
      fieldMap: {
        'Tailor ID': 'tailor_id',
        'Tailor Name': 'tailor_name',
        'Tailor Code': 'tailor_code',
        'Order ID': 'order_id',
        'Order Number': 'order_number',
        'Assigned Date': (item: TailorReport) =>
          item.assigned_date ? new Date(item.assigned_date).toLocaleDateString() : '-',
        'Completion Date': (item: TailorReport) =>
          item.completion_date ? new Date(item.completion_date).toLocaleDateString() : '-',
        'Items Count': (item: TailorReport) => String(item.items_count ?? 0),
        'Total Value': (item: TailorReport) =>
          item.total_value ? `₹${item.total_value.toFixed(2)}` : '-',
        'Status': 'status',
        'Created': (item: TailorReport) =>
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
    return fetchTailorReports(serviceFilters);
  };

  const totalCount = reportsPage?.totalCount ?? reports.length;
  const totalItems = reports.reduce((sum, r) => sum + (r.items_count || 0), 0);
  const totalValue = reports.reduce((sum, r) => sum + (r.total_value || 0), 0);

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
            <Scissors className="h-6 w-6 text-amber-600" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Tailor Reports</h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Scott API
                </Badge>
              </div>
              <p className="text-muted-foreground">
                View and download tailor assignment and work reports
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
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
            placeholder="Search tailor reports..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={reports.length}
            totalCount={totalCount}
          />

          {isLoading ? (
            <MasterTableSkeleton showToolbar={false} columnCount={10} className="mt-6" />
          ) : reports.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 mt-6">
              <p>{searchTerm ? 'No tailor reports match your search' : 'No tailor reports found'}</p>
            </div>
          ) : (
            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Tailor</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.tailor_name || '-'}</TableCell>
                    <TableCell>{report.tailor_code || '-'}</TableCell>
                    <TableCell>{report.order_id || '-'}</TableCell>
                    <TableCell>{report.order_number || '-'}</TableCell>
                    <TableCell>
                      {report.assigned_date
                        ? new Date(report.assigned_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {report.completion_date
                        ? new Date(report.completion_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>{report.items_count ?? '-'}</TableCell>
                    <TableCell>
                      {report.total_value ? `₹${report.total_value.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={handleExportCurrent} title="Export row">
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
        title="Tailor Reports"
        onDownload={handleDownloadWithFilters}
        headers={[
          'Tailor ID',
          'Tailor Name',
          'Tailor Code',
          'Order ID',
          'Order Number',
          'Assigned Date',
          'Completion Date',
          'Items Count',
          'Total Value',
          'Status',
          'Created',
        ]}
        fieldMap={{
          'Tailor ID': 'tailor_id',
          'Tailor Name': 'tailor_name',
          'Tailor Code': 'tailor_code',
          'Order ID': 'order_id',
          'Order Number': 'order_number',
          'Assigned Date': (item: TailorReport) =>
            (item as TailorReport).assigned_date
              ? new Date((item as TailorReport).assigned_date!).toLocaleDateString()
              : '-',
          'Completion Date': (item: TailorReport) =>
            (item as TailorReport).completion_date
              ? new Date((item as TailorReport).completion_date!).toLocaleDateString()
              : '-',
          'Items Count': (item: TailorReport) => String((item as TailorReport).items_count ?? 0),
          'Total Value': (item: TailorReport) =>
            (item as TailorReport).total_value ? `₹${(item as TailorReport).total_value!.toFixed(2)}` : '-',
          'Status': 'status',
          'Created': (item: TailorReport) =>
            new Date((item as TailorReport).created_at).toLocaleDateString(),
        }}
        entityName="tailor-reports"
        showStatusFilter={true}
        statusOptions={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
          { value: 'assigned', label: 'Assigned' },
          { value: 'completed', label: 'Completed' },
        ]}
      />
    </div>
  );
};

export default TailorReportsPage;

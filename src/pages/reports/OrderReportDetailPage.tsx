import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ShoppingCart,
  Calendar,
  User,
  DollarSign,
  FileText,
  Hash,
  Clock,
  MapPin,
  Factory,
  Package,
  Star,
  TrendingUp,
  Scissors,
  Layers,
  Percent,
} from 'lucide-react';
import { useOrderReportById } from '@/hooks/reports/useOrderReports';

const OrderReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: report, isLoading, error } = useOrderReportById(id || null);

  // Get the nested order report data
  const orderData = (report?.order_report as Record<string, unknown> | undefined) ?? report ?? {};

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reports/order-reports')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order Reports
        </Button>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Report not found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {error
                ? `Error loading report: ${error.message}`
                : 'The requested order report could not be found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusVariant =
    orderData.order_status === 'COMPLETED'
      ? 'default'
      : orderData.order_status === 'PENDING'
        ? 'secondary'
        : 'outline';

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    return `₹${value.toLocaleString()}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/reports/order-reports')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Order Reports
        </Button>
      </div>

      {/* Order Summary Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {orderData.jobsheet_number || 'Order Details'}
                </h1>
                <p className="text-blue-100 mt-1">
                  {orderData.order_id} • {orderData.customer_name}
                </p>
              </div>
            </div>
            <Badge
              variant={statusVariant}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              {orderData.order_status || 'Unknown'}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-muted-foreground">Total Quantity</span>
              </div>
              <p className="text-2xl font-bold">{orderData.total_quantity?.toLocaleString() || '-'}</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-muted-foreground">Order Date</span>
              </div>
              <p className="text-2xl font-bold">{formatDate(orderData.order_date)}</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-muted-foreground">Expected Delivery</span>
              </div>
              <p className="text-2xl font-bold">{formatDate(orderData.expected_delivery_date)}</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <Factory className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">Factory</span>
              </div>
              <p className="text-2xl font-bold">{orderData.factory || '-'}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Product & Description */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Product Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{orderData.product || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{orderData.description || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Costs Breakdown */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Cost Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Fabric Rate</p>
                <p className="text-lg font-medium">{formatCurrency(orderData.fabric_rate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trims Cost</p>
                <p className="text-lg font-medium">{formatCurrency(orderData.trims_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overhead</p>
                <p className="text-lg font-medium">{formatCurrency(orderData.overhead)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add-on Cost</p>
                <p className="text-lg font-medium">{formatCurrency(orderData.add_on_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branding Cost</p>
                <p className="text-lg font-medium">{formatCurrency(orderData.branding_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base OF</p>
                <p className="text-lg font-medium">{orderData.base_of ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Base SN</p>
                <p className="text-lg font-medium">{orderData.base_sn ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fabric Consumption</p>
                <p className="text-lg font-medium">{orderData.fabric_consumption ?? '-'}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Customer Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{orderData.customer_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-medium">{orderData.order_id || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Item Type</p>
                    <p className="font-medium capitalize">{orderData.item_type || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Size Breakup</p>
                    <p className="font-medium">{orderData.size_breakup || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Additional Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Percent className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Margin %</p>
                    <p className="font-medium">{orderData.margin_percentage ? `${orderData.margin_percentage}%` : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">KAM</p>
                    <p className="font-medium">{orderData.kam || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-medium">{orderData.rating || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">{orderData.created_by || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          {(orderData.actual_delivery_date || orderData.expected_delivery_date) && (
            <>
              <Separator className="my-6" />
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Delivery Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Delivery</p>
                      <p className="font-medium">{formatDate(orderData.expected_delivery_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Delivery</p>
                      <p className="font-medium">{formatDate(orderData.actual_delivery_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Customer Reviews */}
          {(orderData.customer_positive_review || orderData.customer_negative_review) && (
            <>
              <Separator className="my-6" />
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Customer Reviews
                </h3>
                <div className="space-y-4">
                  {orderData.customer_positive_review && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Positive Review</p>
                      <p className="text-sm">{orderData.customer_positive_review}</p>
                    </div>
                  )}
                  {orderData.customer_negative_review && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Negative Review</p>
                      <p className="text-sm">{orderData.customer_negative_review}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-6" />

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Airtable ID</p>
                <p className="font-mono">{orderData.airtable_order_report_id || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{new Date(report.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p>{new Date(report.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate('/reports/order-reports')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>
    </div>
  );
};

export default OrderReportDetailPage;

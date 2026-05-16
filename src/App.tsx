
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlobalErrorBoundary } from "@/components/common/ErrorBoundary/GlobalErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { registerSW, unregisterSW } from "@/lib/pwa";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Masters = lazy(() => import("./pages/Masters"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ColorsPage = lazy(() => import("./pages/ColorsPage"));
const SizeGroupsPage = lazy(() => import("./pages/SizeGroupsPage"));
const ZonesPage = lazy(() => import("./pages/ZonesPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const StylesPage = lazy(() => import("./pages/StylesPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const SkusPage = lazy(() => import("./pages/SkusPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const FabricPage = lazy(() => import("./pages/FabricPage"));
const PartsPage = lazy(() => import("./pages/PartsPage"));
const AddOnsPage = lazy(() => import("./pages/AddOnsPage"));
const BaseProductPage = lazy(() => import("./pages/BaseProductPage"));
const SizeTypesPage = lazy(() => import("./pages/SizeTypesPage"));
const BaseProductTypesPage = lazy(() => import("./pages/BaseProductTypesPage"));
const ProfitMarginPage = lazy(() => import("./pages/ProfitMarginPage"));
const AppAssetsPage = lazy(() => import("./pages/AppAssetsPage"));
const PromotionalBannersPage = lazy(() => import("./pages/PromotionalBannersPage"));
const ScottPromotionalBannersPage = lazy(() => import("./pages/ScottPromotionalBannersPage"));
const PromotionalAssetsPage = lazy(() => import("./pages/PromotionalAssetsPage"));
const BaseProductAssetInfosPage = lazy(() => import("./pages/BaseProductAssetInfosPage"));
const RmpBrandsPage = lazy(() => import("./pages/RmpBrandsPage"));
const RmpSizesPage = lazy(() => import("./pages/RmpSizesPage"));
const RmpColorsPage = lazy(() => import("./pages/RmpColorsPage"));
const RmpClassesPage = lazy(() => import("./pages/RmpClassesPage"));
const RmpSkusPage = lazy(() => import("./pages/RmpSkusPage"));
const RmpCategoriesPage = lazy(() => import("./pages/RmpCategoriesPage"));
const RmpPricesPage = lazy(() => import("./pages/RmpPricesPage"));
const RmpPriceTypesPage = lazy(() => import("./pages/RmpPriceTypesPage"));
const Warehouse = lazy(() => import("./pages/WarehouseOptimized"));
const WarehouseDetails = lazy(() => import("./pages/WarehouseDetails"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Inbound = lazy(() => import("./pages/Inbound"));
const Customers = lazy(() => import("./pages/Customers"));
const DistributorPriceTypesPage = lazy(() => import("./pages/DistributorPriceTypesPage"));
const Orders = lazy(() => import("./pages/Orders"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Reports pages
const Reports = lazy(() => import("./pages/Reports"));
const OrderReportsPage = lazy(() => import("./pages/reports/OrderReportsPage"));
const OrderReportDetailPage = lazy(() => import("./pages/reports/OrderReportDetailPage"));
const RmpOrderReportsPage = lazy(() => import("./pages/reports/RmpOrderReportsPage"));
const TailorReportsPage = lazy(() => import("./pages/reports/TailorReportsPage"));

// Bulk-edit pages (open in their own browser tab; full-screen, no dashboard chrome)
const RmpBrandsBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpBrandsBulkEditPage"));
const RmpCategoriesBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpCategoriesBulkEditPage"));
const RmpColorsBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpColorsBulkEditPage"));
const RmpSizesBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpSizesBulkEditPage"));
const RmpPriceTypesBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpPriceTypesBulkEditPage"));
const ProfitMarginBulkEditPage = lazy(() => import("./pages/bulk-edit/ProfitMarginBulkEditPage"));
const PartsBulkEditPage = lazy(() => import("./pages/bulk-edit/PartsBulkEditPage"));
const RmpPricesBulkEditPage = lazy(() => import("./pages/bulk-edit/RmpPricesBulkEditPage"));

// Configure QueryClient for large-scale applications
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const key = Array.isArray(query.queryKey) ? query.queryKey.slice(0, 2).join(' › ') : String(query.queryKey);
      toast.error(`Failed to load: ${key}`, { description: msg, duration: 8000 });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="space-y-4 w-full max-w-md">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

const App = () => {
  useEffect(() => {
    // Dev: unregister SW so Workbox precache (production hashes) does not intercept Vite requests.
    // Prod: register for PWA updates.
    if (import.meta.env.PROD) {
      void registerSW();
    } else {
      void unregisterSW();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="scottone-theme">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter 
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <GlobalErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                  <Route path="/auth" element={<Auth />} />

                  {/* Bulk-edit pages render full-screen (no DashboardLayout). */}
                  {/* Declared before the dashboard routes so React Router prefers the more specific path. */}
                  <Route path="/masters/rmp-brands/bulk-edit" element={<ProtectedRoute><RmpBrandsBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/rmp-categories/bulk-edit" element={<ProtectedRoute><RmpCategoriesBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/rmp-colors/bulk-edit" element={<ProtectedRoute><RmpColorsBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/rmp-sizes/bulk-edit" element={<ProtectedRoute><RmpSizesBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/rmp-price-types/bulk-edit" element={<ProtectedRoute><RmpPriceTypesBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/profit-margin/bulk-edit" element={<ProtectedRoute><ProfitMarginBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/parts/bulk-edit" element={<ProtectedRoute><PartsBulkEditPage /></ProtectedRoute>} />
                  <Route path="/masters/rmp-prices/bulk-edit" element={<ProtectedRoute><RmpPricesBulkEditPage /></ProtectedRoute>} />

                  <Route path="/" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<Users />} />
                    <Route path="masters" element={<Masters />} />
                    <Route path="masters/brands" element={<BrandsPage />} />
                    <Route path="masters/authorized-brands" element={<BrandsPage />} />
                    <Route path="masters/categories" element={<CategoriesPage />} />
                    <Route path="masters/colors" element={<ColorsPage />} />
                    <Route path="masters/size-groups" element={<SizeGroupsPage />} />
                    <Route path="masters/zones" element={<ZonesPage />} />
                    <Route path="masters/vendors" element={<VendorsPage />} />
                    <Route path="masters/styles" element={<StylesPage />} />
                    <Route path="masters/classes" element={<ClassesPage />} />
                    <Route path="masters/skus" element={<SkusPage />} />
                    <Route path="masters/media" element={<MediaPage />} />
                    <Route path="masters/fabric" element={<FabricPage />} />
                    <Route path="masters/parts" element={<PartsPage />} />
                    <Route path="masters/add-ons" element={<AddOnsPage />} />
                    <Route path="masters/base-product" element={<BaseProductPage />} />
                    <Route path="masters/size-types" element={<SizeTypesPage />} />
                    <Route path="masters/parent-categories" element={<BaseProductTypesPage />} />
                    <Route
                      path="masters/base-product-types"
                      element={<Navigate to="/masters/parent-categories" replace />}
                    />
                    <Route path="masters/profit-margin" element={<ProfitMarginPage />} />
                    <Route path="masters/app-assets" element={<AppAssetsPage />} />
                    <Route path="masters/promotional-banners" element={<PromotionalBannersPage />} />
                    <Route path="masters/promotional-banners-rmp" element={<ScottPromotionalBannersPage />} />
                    <Route path="masters/promotional-assets" element={<PromotionalAssetsPage />} />
                    <Route path="masters/base-product-asset-links" element={<BaseProductAssetInfosPage />} />
                    <Route path="masters/rmp-brands" element={<RmpBrandsPage />} />
                    <Route path="masters/rmp-sizes" element={<RmpSizesPage />} />
                    <Route path="masters/rmp-colors" element={<RmpColorsPage />} />
                    <Route path="masters/rmp-classes" element={<RmpClassesPage />} />
                    <Route path="masters/rmp-skus" element={<RmpSkusPage />} />
                    <Route path="masters/rmp-categories" element={<RmpCategoriesPage />} />
                    <Route path="masters/rmp-prices" element={<RmpPricesPage />} />
                    <Route path="masters/rmp-price-types" element={<RmpPriceTypesPage />} />
                    <Route path="warehouse" element={<Warehouse />} />
                    <Route path="warehouse/:id" element={<WarehouseDetails />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inbound" element={<Inbound />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="distributors/:id/price-types" element={<DistributorPriceTypesPage />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="reports/order-reports" element={<OrderReportsPage />} />
                    <Route path="reports/order-reports/:id" element={<OrderReportDetailPage />} />
                    <Route path="reports/rmp-order-reports" element={<RmpOrderReportsPage />} />
                    <Route path="reports/tailor-reports" element={<TailorReportsPage />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </GlobalErrorBoundary>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

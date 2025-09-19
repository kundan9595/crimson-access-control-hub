
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GlobalErrorBoundary } from "@/components/common/ErrorBoundary/GlobalErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import PWAInstallPrompt from "@/components/common/PWAInstallPrompt";
import { registerSW } from "@/lib/pwa";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RolesPermissions = lazy(() => import("./pages/RolesPermissions"));
const Users = lazy(() => import("./pages/Users"));
const Masters = lazy(() => import("./pages/Masters"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ColorsPage = lazy(() => import("./pages/ColorsPage"));
const SizeGroupsPage = lazy(() => import("./pages/SizeGroupsPage"));
const ZonesPage = lazy(() => import("./pages/ZonesPage"));
const PriceTypesPage = lazy(() => import("./pages/PriceTypesPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const StylesPage = lazy(() => import("./pages/StylesPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const SkusPage = lazy(() => import("./pages/SkusPage"));
const MediaPage = lazy(() => import("./pages/MediaPage"));
const FabricPage = lazy(() => import("./pages/FabricPage"));
const PartsPage = lazy(() => import("./pages/PartsPage"));
const AddOnsPage = lazy(() => import("./pages/AddOnsPage"));
const BaseProductPage = lazy(() => import("./pages/BaseProductPage"));
const ProfitMarginPage = lazy(() => import("./pages/ProfitMarginPage"));
const AppAssetsPage = lazy(() => import("./pages/AppAssetsPage"));
const PromotionalBannersPage = lazy(() => import("./pages/PromotionalBannersPage"));
const PromotionalAssetsPage = lazy(() => import("./pages/PromotionalAssetsPage"));
const Warehouse = lazy(() => import("./pages/WarehouseOptimized"));
const WarehouseDetails = lazy(() => import("./pages/WarehouseDetails"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Inbound = lazy(() => import("./pages/Inbound"));
const Customers = lazy(() => import("./pages/Customers"));
const Orders = lazy(() => import("./pages/Orders"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure QueryClient for large-scale applications
const queryClient = new QueryClient({
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
    // Register service worker for PWA functionality
    registerSW();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="crimson-theme">
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
                  <Route path="/" element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="roles-permissions" element={<RolesPermissions />} />
                    <Route path="users" element={<Users />} />
                    <Route path="masters" element={<Masters />} />
                    <Route path="masters/brands" element={<BrandsPage />} />
                    <Route path="masters/categories" element={<CategoriesPage />} />
                    <Route path="masters/colors" element={<ColorsPage />} />
                    <Route path="masters/size-groups" element={<SizeGroupsPage />} />
                    <Route path="masters/zones" element={<ZonesPage />} />
                    <Route path="masters/price-types" element={<PriceTypesPage />} />
                    <Route path="masters/vendors" element={<VendorsPage />} />
                    <Route path="masters/styles" element={<StylesPage />} />
                    <Route path="masters/classes" element={<ClassesPage />} />
                    <Route path="masters/skus" element={<SkusPage />} />
                    <Route path="masters/media" element={<MediaPage />} />
                    <Route path="masters/fabric" element={<FabricPage />} />
                    <Route path="masters/parts" element={<PartsPage />} />
                    <Route path="masters/add-ons" element={<AddOnsPage />} />
                    <Route path="masters/base-product" element={<BaseProductPage />} />
                    <Route path="masters/profit-margin" element={<ProfitMarginPage />} />
                    <Route path="masters/app-assets" element={<AppAssetsPage />} />
                    <Route path="masters/promotional-banners" element={<PromotionalBannersPage />} />
                    <Route path="masters/promotional-assets" element={<PromotionalAssetsPage />} />
                    <Route path="warehouse" element={<Warehouse />} />
                    <Route path="warehouse/:id" element={<WarehouseDetails />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="inbound" element={<Inbound />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="orders" element={<Orders />} />
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

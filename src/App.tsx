
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import RolesPermissions from "./pages/RolesPermissions";
import Users from "./pages/Users";
import Masters from "./pages/Masters";
import BrandsPage from "./pages/BrandsPage";
import CategoriesPage from "./pages/CategoriesPage";
import ColorsPage from "./pages/ColorsPage";
import SizeGroupsPage from "./pages/SizeGroupsPage";
import ZonesPage from "./pages/ZonesPage";
import PriceTypesPage from "./pages/PriceTypesPage";
import VendorsPage from "./pages/VendorsPage";
import StylesPage from "./pages/StylesPage";
import ClassesPage from "./pages/ClassesPage";
import SkusPage from "./pages/SkusPage";
import MediaPage from "./pages/MediaPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

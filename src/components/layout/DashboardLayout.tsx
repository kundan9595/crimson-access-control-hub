
import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Users, Settings, Building, Package, ShoppingCart, LogOut, Palette, Truck, UserCheck, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { ScottApiEnvBadge } from '@/components/layout/ScottApiEnvBadge';

const DashboardLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Building, label: 'Warehouses', path: '/warehouse' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Truck, label: 'Inbound', path: '/inbound' },
    { icon: UserCheck, label: 'Customers', path: '/customers' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
    { icon: Palette, label: 'Masters', path: '/masters' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S1</span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">Scott One</h2>
                <p className="text-sm text-muted-foreground">Company Dashboard</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))}>
                    <Link to={item.path}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <div className="mt-auto p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <ScottApiEnvBadge />
              <ThemeSwitcher />
            </div>
          </header>
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

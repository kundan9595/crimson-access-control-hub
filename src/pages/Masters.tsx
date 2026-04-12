
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Tags,
  Palette,
  Ruler,
  MapPin,
  DollarSign,
  Users,
  Shirt,
  ArrowRight,
  Package2,
  FolderOpen,
  Scissors,
  Wrench,
  Plus,
  Box,
  TrendingUp,
  Smartphone,
  Search,
  Image as ImageIcon,
  Megaphone,
  Link2,
  Grid3X3,
  Layers,
  Sparkles,
  ShoppingBag,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MasterCategory {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  isScottApi: boolean;
}

const MASTERS_TAB_KEY = 'masters-active-tab';

type TabValue = 'ready-made' | 'custom' | 'other';

const Masters = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Get active tab from sessionStorage, default to 'ready-made'
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const saved = sessionStorage.getItem(MASTERS_TAB_KEY);
    return (saved as TabValue) || 'ready-made';
  });

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue;
    setActiveTab(tabValue);
    sessionStorage.setItem(MASTERS_TAB_KEY, tabValue);
  };

  // Ready Made Products
  const readyMadeMasters: MasterCategory[] = [
    {
      title: 'Brands',
      description: 'Manage Ready Made Product brands with category associations',
      icon: Package,
      path: '/masters/rmp-brands',
      color: 'text-blue-600',
      isScottApi: true,
    },
    {
      title: 'Authorized Brands',
      description: 'Scott authorized brands master — link targets for RMP brands',
      icon: ShieldCheck,
      path: '/masters/authorized-brands',
      color: 'text-blue-700',
      isScottApi: true,
    },
    {
      title: 'Sizes',
      description: 'Configure size types for RMP products (alpha, numeric, free_size, kids, bags)',
      icon: Ruler,
      path: '/masters/rmp-sizes',
      color: 'text-orange-600',
      isScottApi: true,
    },
    {
      title: 'Colors',
      description: 'Define color variants with hex codes for RMP products',
      icon: Palette,
      path: '/masters/rmp-colors',
      color: 'text-purple-600',
      isScottApi: true,
    },
    {
      title: 'Product Categories',
      description: 'RMP product categories (Scott Ready Stock)',
      icon: LayoutGrid,
      path: '/masters/rmp-categories',
      color: 'text-indigo-600',
      isScottApi: true,
    },
    {
      title: 'RMP Prices',
      description: 'Price rows for RMP SKUs and Scott price types',
      icon: DollarSign,
      path: '/masters/rmp-prices',
      color: 'text-amber-600',
      isScottApi: true,
    },
    {
      title: 'RMP Price Types',
      description: 'Price type definitions for customer, dealer, zone',
      icon: DollarSign,
      path: '/masters/rmp-price-types',
      color: 'text-emerald-600',
      isScottApi: true,
    },
    {
      title: 'Classes',
      description: 'Manage RMP product classes with multiple image support',
      icon: Shirt,
      path: '/masters/rmp-classes',
      color: 'text-cyan-600',
      isScottApi: true,
    },
    {
      title: 'SKU',
      description: 'Manage RMP SKUs with GST rates and product associations',
      icon: Package2,
      path: '/masters/rmp-skus',
      color: 'text-emerald-600',
      isScottApi: true,
    },
  ];

  // Custom Products
  const customMasters: MasterCategory[] = [
    {
      title: 'Parent Category',
      description: 'Manage parent product categories (taxonomy)',
      icon: Layers,
      path: '/masters/parent-categories',
      color: 'text-rose-600',
      isScottApi: true,
    },
    {
      title: 'Base Product',
      description: 'Manage base product templates and configurations',
      icon: Box,
      path: '/masters/base-product',
      color: 'text-rose-500',
      isScottApi: true,
    },
    {
      title: 'Fabric',
      description: 'Manage fabric types, properties, and specifications',
      icon: Scissors,
      path: '/masters/fabric',
      color: 'text-amber-600',
      isScottApi: true,
    },
    {
      title: 'Parts',
      description: 'Define and manage product parts and components',
      icon: Wrench,
      path: '/masters/parts',
      color: 'text-slate-600',
      isScottApi: true,
    },
    {
      title: 'Add Ons',
      description: 'Configure additional features and add-on components',
      icon: Plus,
      path: '/masters/add-ons',
      color: 'text-lime-600',
      isScottApi: true,
    },
    {
      title: 'Profit Margins',
      description: 'Configure profit margins and pricing strategies',
      icon: TrendingUp,
      path: '/masters/profit-margin',
      color: 'text-teal-600',
      isScottApi: true,
    },
    {
      title: 'Colors',
      description: 'Define color variants for your products',
      icon: Palette,
      path: '/masters/colors',
      color: 'text-violet-600',
      isScottApi: true,
    },
    {
      title: 'App Assets',
      description: 'Manage application assets, icons, and media resources',
      icon: Smartphone,
      path: '/masters/app-assets',
      color: 'text-sky-600',
      isScottApi: true,
    },
    {
      title: 'Base Product App Assets',
      description: 'Manage links between base products, add-ons, parts, and asset infos',
      icon: Link2,
      path: '/masters/base-product-asset-links',
      color: 'text-amber-600',
      isScottApi: true,
    },
    {
      title: 'Size Types',
      description: 'Scott dashboard size types (API)',
      icon: Ruler,
      path: '/masters/size-types',
      color: 'text-orange-500',
      isScottApi: true,
    },
    {
      title: 'Sizes',
      description: 'Create and manage sizes linked to size types',
      icon: Ruler,
      path: '/masters/size-groups',
      color: 'text-orange-600',
      isScottApi: true,
    },
  ];

  // Other Masters
  const otherMasters: MasterCategory[] = [
    {
      title: 'Catalogue Promotions',
      description: 'Scott dashboard catalogue promotions (name, link, category, thumbnail)',
      icon: ImageIcon,
      path: '/masters/promotional-banners',
      color: 'text-purple-600',
      isScottApi: true,
    },
    {
      title: 'Promotional Banners',
      description: 'Manage RMP promotional banners with category, class and brand targeting',
      icon: Megaphone,
      path: '/masters/promotional-banners-rmp',
      color: 'text-pink-600',
      isScottApi: true,
    },
    {
      title: 'Categories',
      description: 'Organize products into categories and subcategories',
      icon: Tags,
      path: '/masters/categories',
      color: 'text-green-600',
      isScottApi: false,
    },
    {
      title: 'Zones',
      description: 'Configure geographical zones and locations',
      icon: MapPin,
      path: '/masters/zones',
      color: 'text-red-600',
      isScottApi: false,
    },
    {
      title: 'Vendors',
      description: 'Manage vendor information and relationships',
      icon: Users,
      path: '/masters/vendors',
      color: 'text-indigo-600',
      isScottApi: false,
    },
    {
      title: 'Styles',
      description: 'Create and manage product styles with brands and categories',
      icon: Shirt,
      path: '/masters/styles',
      color: 'text-pink-600',
      isScottApi: false,
    },
    {
      title: 'Classes',
      description: 'Manage product classes with styles, colors, and detailed specifications',
      icon: ShoppingBag,
      path: '/masters/classes',
      color: 'text-cyan-600',
      isScottApi: false,
    },
    {
      title: 'SKUs',
      description: 'Manage individual product SKUs with pricing, dimensions, and specifications',
      icon: Package2,
      path: '/masters/skus',
      color: 'text-emerald-600',
      isScottApi: false,
    },
    {
      title: 'Media',
      description: 'Organize and manage media files and folders for your products',
      icon: FolderOpen,
      path: '/masters/media',
      color: 'text-violet-600',
      isScottApi: false,
    },
    {
      title: 'Promotional Assets',
      description: 'Manage promotional assets including videos, catalogues, and images',
      icon: ImageIcon,
      path: '/masters/promotional-assets',
      color: 'text-blue-600',
      isScottApi: false,
    },
  ];

  const filterCategories = (categories: MasterCategory[]) => {
    if (!searchTerm.trim()) {
      return categories;
    }
    const term = searchTerm.toLowerCase();
    return categories.filter(category => 
      category.title.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    );
  };

  const sortByTitle = (categories: MasterCategory[]) =>
    [...categories].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

  const filteredReadyMade = useMemo(
    () => sortByTitle(filterCategories(readyMadeMasters)),
    [searchTerm]
  );
  const filteredCustom = useMemo(
    () => sortByTitle(filterCategories(customMasters)),
    [searchTerm]
  );
  const filteredOther = useMemo(
    () => sortByTitle(filterCategories(otherMasters)),
    [searchTerm]
  );

  const allMasters = [...readyMadeMasters, ...customMasters, ...otherMasters];
  const totalResults = filteredReadyMade.length + filteredCustom.length + filteredOther.length;

  const MasterCard = ({ category }: { category: MasterCategory }) => {
    const Icon = category.icon;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Icon className={`h-6 w-6 ${category.color}`} />
            <CardTitle className="text-xl">{category.title}</CardTitle>
            {category.isScottApi && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                Scott API
              </Badge>
            )}
          </div>
          <CardDescription>{category.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate(category.path)}
            className="w-full"
            variant="outline"
          >
            Manage {category.title}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  const MastersGrid = ({ categories }: { categories: MasterCategory[] }) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {categories.length > 0 ? (
        categories.map((category) => (
          <MasterCard key={category.path} category={category} />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No masters found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse all available masters.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Master Data</h1>
        <p className="text-muted-foreground">
          Manage all your master data configurations from one central location
        </p>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search masters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground">
            Found {totalResults} of {allMasters.length} masters
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="ready-made" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Ready Made
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Custom
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Other
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready-made" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Ready Made Products</h2>
            <p className="text-sm text-muted-foreground">
              Manage pre-configured product templates and variants for ready-made products
            </p>
          </div>
          <MastersGrid categories={filteredReadyMade} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Custom Products</h2>
            <p className="text-sm text-muted-foreground">
              Configure customizable product components and specifications
            </p>
          </div>
          <MastersGrid categories={filteredCustom} />
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Other Masters</h2>
            <p className="text-sm text-muted-foreground">
              Promotional content, organizational data, and system configurations
            </p>
          </div>
          <MastersGrid categories={filteredOther} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Masters;

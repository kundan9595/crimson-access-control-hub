
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Masters = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const masterCategories = [
    {
      title: 'Brands',
      description: 'Manage product brands and their information',
      icon: Package,
      path: '/masters/brands',
      color: 'text-blue-600',
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
      title: 'Colors',
      description: 'Define color variants for your products',
      icon: Palette,
      path: '/masters/colors',
      color: 'text-purple-600',
      isScottApi: true,
    },
    {
      title: 'Size Groups',
      description: 'Create and manage size groups and individual sizes',
      icon: Ruler,
      path: '/masters/size-groups',
      color: 'text-orange-600',
      isScottApi: false,
    },
    {
      title: 'Size types',
      description: 'Scott dashboard size types (API)',
      icon: Ruler,
      path: '/masters/size-types',
      color: 'text-orange-500',
      isScottApi: true,
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
      icon: Shirt,
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
      title: 'Fabric',
      description: 'Manage fabric types, properties, and specifications',
      icon: Scissors,
      path: '/masters/fabric',
      color: 'text-amber-600',
      isScottApi: false,
    },
    {
      title: 'Parts',
      description: 'Define and manage product parts and components',
      icon: Wrench,
      path: '/masters/parts',
      color: 'text-slate-600',
      isScottApi: false,
    },
    {
      title: 'Add Ons',
      description: 'Configure additional features and add-on components',
      icon: Plus,
      path: '/masters/add-ons',
      color: 'text-lime-600',
      isScottApi: false,
    },
    {
      title: 'Base Product',
      description: 'Manage base product templates and configurations',
      icon: Box,
      path: '/masters/base-product',
      color: 'text-rose-600',
      isScottApi: false,
    },
    {
      title: 'Base product types',
      description: 'Scott dashboard base product types (taxonomy)',
      icon: Box,
      path: '/masters/base-product-types',
      color: 'text-rose-500',
      isScottApi: true,
    },
    {
      title: 'Profit Margin',
      description: 'Configure profit margins and pricing strategies',
      icon: TrendingUp,
      path: '/masters/profit-margin',
      color: 'text-teal-600',
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
      title: 'Catalogue promotions',
      description: 'Scott dashboard catalogue promotions (name, link, category, thumbnail)',
      icon: ImageIcon,
      path: '/masters/promotional-banners',
      color: 'text-purple-600',
      isScottApi: true,
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

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return masterCategories;
    }
    
    const term = searchTerm.toLowerCase();
    return masterCategories.filter(category => 
      category.title.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    );
  }, [searchTerm]);

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
            Found {filteredCategories.length} of {masterCategories.length} masters
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="hover:shadow-md transition-shadow">
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
          })
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
    </div>
  );
};

export default Masters;

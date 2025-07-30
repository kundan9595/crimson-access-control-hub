
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    },
    {
      title: 'Categories',
      description: 'Organize products into categories and subcategories',
      icon: Tags,
      path: '/masters/categories',
      color: 'text-green-600',
    },
    {
      title: 'Colors',
      description: 'Define color variants for your products',
      icon: Palette,
      path: '/masters/colors',
      color: 'text-purple-600',
    },
    {
      title: 'Size Groups',
      description: 'Create and manage size groups and individual sizes',
      icon: Ruler,
      path: '/masters/size-groups',
      color: 'text-orange-600',
    },
    {
      title: 'Zones',
      description: 'Configure geographical zones and locations',
      icon: MapPin,
      path: '/masters/zones',
      color: 'text-red-600',
    },
    {
      title: 'Price Types',
      description: 'Set up different pricing structures',
      icon: DollarSign,
      path: '/masters/price-types',
      color: 'text-yellow-600',
    },
    {
      title: 'Vendors',
      description: 'Manage vendor information and relationships',
      icon: Users,
      path: '/masters/vendors',
      color: 'text-indigo-600',
    },
    {
      title: 'Styles',
      description: 'Create and manage product styles with brands and categories',
      icon: Shirt,
      path: '/masters/styles',
      color: 'text-pink-600',
    },
    {
      title: 'Classes',
      description: 'Manage product classes with styles, colors, and detailed specifications',
      icon: Shirt,
      path: '/masters/classes',
      color: 'text-cyan-600',
    },
    {
      title: 'SKUs',
      description: 'Manage individual product SKUs with pricing, dimensions, and specifications',
      icon: Package2,
      path: '/masters/skus',
      color: 'text-emerald-600',
    },
    {
      title: 'Media',
      description: 'Organize and manage media files and folders for your products',
      icon: FolderOpen,
      path: '/masters/media',
      color: 'text-violet-600',
    },
    {
      title: 'Fabric',
      description: 'Manage fabric types, properties, and specifications',
      icon: Scissors,
      path: '/masters/fabric',
      color: 'text-amber-600',
    },
    {
      title: 'Parts',
      description: 'Define and manage product parts and components',
      icon: Wrench,
      path: '/masters/parts',
      color: 'text-slate-600',
    },
    {
      title: 'Add Ons',
      description: 'Configure additional features and add-on components',
      icon: Plus,
      path: '/masters/add-ons',
      color: 'text-lime-600',
    },
    {
      title: 'Base Product',
      description: 'Manage base product templates and configurations',
      icon: Box,
      path: '/masters/base-product',
      color: 'text-rose-600',
    },
    {
      title: 'Profit Margin',
      description: 'Configure profit margins and pricing strategies',
      icon: TrendingUp,
      path: '/masters/profit-margin',
      color: 'text-teal-600',
    },
    {
      title: 'App Assets',
      description: 'Manage application assets, icons, and media resources',
      icon: Smartphone,
      path: '/masters/app-assets',
      color: 'text-sky-600',
    },
    {
      title: 'Promotional Banners',
      description: 'Manage promotional banners with category, brand, and class associations',
      icon: ImageIcon,
      path: '/masters/promotional-banners',
      color: 'text-purple-600',
    },
    {
      title: 'Promotional Assets',
      description: 'Manage promotional assets including videos, catalogues, and images',
      icon: ImageIcon,
      path: '/masters/promotional-assets',
      color: 'text-blue-600',
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
    <div className="container mx-auto p-6 space-y-6">
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

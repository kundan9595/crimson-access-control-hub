
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  FolderOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Masters = () => {
  const navigate = useNavigate();

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
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Master Data</h1>
        <p className="text-muted-foreground">
          Manage all your master data configurations from one central location
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {masterCategories.map((category) => {
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
        })}
      </div>
    </div>
  );
};

export default Masters;

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Package, Tag, Palette, Ruler, MapPin, DollarSign, Users, Shirt } from 'lucide-react';
import { 
  useBrands, 
  useCategories, 
  useColors, 
  useSizeGroups, 
  useZones, 
  usePriceTypes, 
  useVendors,
  useStyles
} from '@/hooks/useMasters';
import { Link } from 'react-router-dom';

const Masters = () => {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: colors } = useColors();
  const { data: sizeGroups } = useSizeGroups();
  const { data: zones } = useZones();
  const { data: priceTypes } = usePriceTypes();
  const { data: vendors } = useVendors();
  const { data: styles } = useStyles();

  const masterSections = [
    {
      title: 'Styles',
      description: 'Manage product styles and their variations',
      icon: Shirt,
      data: styles?.slice(0, 5) || [],
      total: styles?.length || 0,
      viewMorePath: '/masters/styles',
      addNewPath: '/masters/styles?add=true',
      renderItem: (style: any) => (
        <div key={style.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{style.name}</h4>
            <p className="text-sm text-muted-foreground">Code: {style.code}</p>
            {style.description && (
              <p className="text-sm text-muted-foreground">{style.description}</p>
            )}
            <div className="flex gap-2 mt-1">
              {style.season && (
                <Badge variant="outline" className="text-xs capitalize">
                  {style.season.replace('_', ' ')}
                </Badge>
              )}
              {style.gender && (
                <Badge variant="outline" className="text-xs capitalize">
                  {style.gender}
                </Badge>
              )}
            </div>
          </div>
          <Badge variant={style.status === 'active' ? 'default' : 'secondary'}>
            {style.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Brands',
      description: 'Manage product brands and their details',
      icon: Package,
      data: brands?.slice(0, 5) || [],
      total: brands?.length || 0,
      viewMorePath: '/masters/brands',
      addNewPath: '/masters/brands?add=true',
      renderItem: (brand: any) => (
        <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {brand.logo_url && (
              <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 rounded object-cover" />
            )}
            <div>
              <h4 className="font-medium">{brand.name}</h4>
              {brand.description && (
                <p className="text-sm text-muted-foreground">{brand.description}</p>
              )}
            </div>
          </div>
          <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
            {brand.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Categories',
      description: 'Organize products into categories',
      icon: Tag,
      data: categories?.slice(0, 5) || [],
      total: categories?.length || 0,
      viewMorePath: '/masters/categories',
      addNewPath: '/masters/categories?add=true',
      renderItem: (category: any) => (
        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{category.name}</h4>
            {category.description && (
              <p className="text-sm text-muted-foreground">{category.description}</p>
            )}
            {category.parent_id && (
              <p className="text-xs text-muted-foreground">
                Parent: {categories?.find(c => c.id === category.parent_id)?.name}
              </p>
            )}
          </div>
          <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
            {category.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Colors',
      description: 'Define color variations for products',
      icon: Palette,
      data: colors?.slice(0, 5) || [],
      total: colors?.length || 0,
      viewMorePath: '/masters/colors',
      addNewPath: '/masters/colors?add=true',
      renderItem: (color: any) => (
        <div key={color.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border border-gray-200"
              style={{ backgroundColor: color.hex_code }}
            />
            <div>
              <h4 className="font-medium">{color.name}</h4>
              <p className="text-sm text-muted-foreground">{color.hex_code}</p>
            </div>
          </div>
          <Badge variant={color.status === 'active' ? 'default' : 'secondary'}>
            {color.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Size Groups',
      description: 'Manage size groupings and individual sizes',
      icon: Ruler,
      data: sizeGroups?.slice(0, 5) || [],
      total: sizeGroups?.length || 0,
      viewMorePath: '/masters/size-groups',
      addNewPath: '/masters/size-groups?add=true',
      renderItem: (sizeGroup: any) => (
        <div key={sizeGroup.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{sizeGroup.name}</h4>
            {sizeGroup.description && (
              <p className="text-sm text-muted-foreground">{sizeGroup.description}</p>
            )}
          </div>
          <Badge variant={sizeGroup.status === 'active' ? 'default' : 'secondary'}>
            {sizeGroup.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Zones',
      description: 'Manage geographical zones and warehouse assignments',
      icon: MapPin,
      data: zones?.slice(0, 5) || [],
      total: zones?.length || 0,
      viewMorePath: '/masters/zones',
      addNewPath: '/masters/zones?add=true',
      renderItem: (zone: any) => (
        <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{zone.name}</h4>
            <p className="text-sm text-muted-foreground">Code: {zone.code}</p>
            {zone.description && (
              <p className="text-sm text-muted-foreground">{zone.description}</p>
            )}
          </div>
          <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
            {zone.status}
          </Badge>
        </div>
      )
    },
    {
      title: 'Price Types',
      description: 'Configure pricing structures and multipliers',
      icon: DollarSign,
      data: priceTypes?.slice(0, 5) || [],
      total: priceTypes?.length || 0,
      viewMorePath: '/masters/price-types',
      addNewPath: '/masters/price-types?add=true',
      renderItem: (priceType: any) => (
        <div key={priceType.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{priceType.name}</h4>
            <p className="text-sm text-muted-foreground">Code: {priceType.code}</p>
            {priceType.multiplier && (
              <p className="text-sm text-muted-foreground">Multiplier: {priceType.multiplier}x</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {priceType.is_default && (
              <Badge variant="outline" className="text-xs">Default</Badge>
            )}
            <Badge variant={priceType.status === 'active' ? 'default' : 'secondary'}>
              {priceType.status}
            </Badge>
          </div>
        </div>
      )
    },
    {
      title: 'Vendors',
      description: 'Manage supplier and vendor information',
      icon: Users,
      data: vendors?.slice(0, 5) || [],
      total: vendors?.length || 0,
      viewMorePath: '/masters/vendors',
      addNewPath: '/masters/vendors?add=true',
      renderItem: (vendor: any) => (
        <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <h4 className="font-medium">{vendor.name}</h4>
            <p className="text-sm text-muted-foreground">Code: {vendor.code}</p>
            {vendor.contact_person && (
              <p className="text-sm text-muted-foreground">Contact: {vendor.contact_person}</p>
            )}
          </div>
          <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
            {vendor.status}
          </Badge>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Masters</h1>
        <p className="text-muted-foreground">Manage styles, brands, categories, colors, sizes, zones, price types, and vendors for your products</p>
      </div>

      <div className="grid gap-6">
        {masterSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <section.icon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild>
                    <Link to={section.addNewPath}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.data.length > 0 ? (
                  <>
                    {section.data.map(section.renderItem)}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {Math.min(5, section.total)} of {section.total} {section.title.toLowerCase()}
                      </p>
                      <Button variant="outline" asChild>
                        <Link to={section.viewMorePath}>
                          View All
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <section.icon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No {section.title.toLowerCase()} found</p>
                    <p className="text-sm">Get started by adding your first {section.title.toLowerCase().slice(0, -1)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Masters;

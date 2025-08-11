import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import PromotionalBannerDialog from '@/components/masters/PromotionalBannerDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { usePromotionalBanners, useDeletePromotionalBanner } from '@/hooks/masters/usePromotionalBanners';
import { useCategories } from '@/hooks/masters/useCategories';
import { useBrands } from '@/hooks/masters/useBrands';
import { useClasses } from '@/hooks/masters/useClasses';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { Edit, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import type { PromotionalBanner } from '@/services/masters/types';

const PromotionalBannersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBanner, setSelectedBanner] = useState<PromotionalBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: promotionalBanners = [], isLoading } = usePromotionalBanners();
  const deletePromotionalBannerMutation = useDeletePromotionalBanner();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: classes = [] } = useClasses();

  // Helper functions to get related entity names
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '-';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || '-';
  };

  const getClassName = (classId?: string) => {
    if (!classId) return '-';
    const cls = classes.find(c => c.id === classId);
    return cls?.name || '-';
  };

  const filteredBanners = promotionalBanners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(banner.category_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBrandName(banner.brand_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClassName(banner.class_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedBanner(null);
    setDialogOpen(true);
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setSelectedBanner(banner);
    setDialogOpen(true);
  };

  const handleDelete = async (banner: PromotionalBanner) => {
    if (window.confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      deletePromotionalBannerMutation.mutate(banner.id);
    }
  };

  const handleExport = () => {
    if (!promotionalBanners || promotionalBanners.length === 0) return;

    exportToCSV({
      filename: generateExportFilename('promotional-banners'),
      headers: ['Title', 'Category', 'Brand', 'Class', 'Position', 'Status', 'Created At'],
      data: promotionalBanners,
      fieldMap: {
        'Title': 'title',
        'Category': (item: PromotionalBanner) => getCategoryName(item.category_id),
        'Brand': (item: PromotionalBanner) => getBrandName(item.brand_id),
        'Class': (item: PromotionalBanner) => getClassName(item.class_id),
        'Position': 'position',
        'Status': 'status',
        'Created At': (item: PromotionalBanner) => new Date(item.created_at).toLocaleDateString()
      }
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Title', 'Category', 'Brand', 'Class', 'Position', 'Status'];
  const sampleData = [
    ['Summer Sale Banner', 'Clothing', 'Nike', 'Sports T-Shirt', '1', 'active'],
    ['Winter Collection', 'Footwear', 'Adidas', '', '2', 'active']
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p>Loading promotional banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Promotional Banners"
        description="Manage promotional banners with category, brand, and class associations"
        icon={<ImageIcon className="h-6 w-6 text-purple-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={filteredBanners.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search promotional banners..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredBanners.length}
            totalCount={promotionalBanners.length}
          />
          
          <div className="mt-6">
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No promotional banners found</p>
                <p className="text-sm">Click "Add Promotional Banner" to create your first banner</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banner</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        {banner.banner_image ? (
                          <img 
                            src={banner.banner_image} 
                            alt={banner.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell>{getCategoryName(banner.category_id)}</TableCell>
                      <TableCell>{getBrandName(banner.brand_id)}</TableCell>
                      <TableCell>{getClassName(banner.class_id)}</TableCell>
                      <TableCell>{banner.position}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          banner.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {banner.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(banner)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <PromotionalBannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotionalBanner={selectedBanner}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="promotionalBanners"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default PromotionalBannersPage; 
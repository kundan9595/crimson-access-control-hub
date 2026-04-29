import React, { useState, useEffect, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import ScottPromotionalBannerDialog from '@/components/masters/ScottPromotionalBannerDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import {
  useScottPromotionalBanners,
  useDeleteScottPromotionalBanner,
  type ScottPromotionalBanner,
  type PromotionalBannerFilter,
} from '@/hooks/masters/useScottPromotionalBanners';
import { useAllRmpCategories } from '@/hooks/masters/useRmpCategories';
import { useAllRmpClasses } from '@/hooks/masters/useRmpClasses';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';
import { useAllRmpBrands } from '@/hooks/masters/useRmpBrands';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { Edit, Trash2, Image as ImageIcon, Megaphone } from 'lucide-react';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchPromotionalBanners } from '@/services/masters/scottPromotionalBannersService';
import { config } from '@/config/environment';

const ScottPromotionalBannersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const filters: PromotionalBannerFilter | undefined = searchTerm ? { search: searchTerm } : undefined;
  const [selectedBanner, setSelectedBanner] = useState<ScottPromotionalBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: bannersPage, isLoading, isFetching } = useScottPromotionalBanners(page, pageSize, filters);
  const promotionalBanners = bannersPage?.data ?? [];
  const deletePromotionalBannerMutation = useDeleteScottPromotionalBanner();

  // Fetch related masters for client-side lookup (fallback if API doesn't return populated relations)
  const { data: rmpCategories = [] } = useAllRmpCategories();
  const { data: rmpClasses = [] } = useAllRmpClasses();
  const { data: rmpBrands = [] } = useAllRmpBrands();

  // Create lookup maps
  const categoryById = useMemo(() => new Map(rmpCategories.map(c => [c.id, c])), [rmpCategories]);
  const classById = useMemo(() => new Map(rmpClasses.map(c => [c.id, c])), [rmpClasses]);
  const brandById = useMemo(() => new Map(rmpBrands.map(b => [b.id, b])), [rmpBrands]);

  // Helper functions to resolve relations (use populated relation if available, otherwise lookup)
  const resolveCategory = (banner: ScottPromotionalBanner) => {
    if (banner.rmp_category?.name) return banner.rmp_category.name;
    if (banner.rmp_category_id) return categoryById.get(banner.rmp_category_id)?.name || '—';
    return '—';
  };

  const resolveClass = (banner: ScottPromotionalBanner) => {
    if (banner.rmp_class?.name) return banner.rmp_class.name;
    if (banner.rmp_class_id) return classById.get(banner.rmp_class_id)?.name || '—';
    return '—';
  };

  const resolveBrand = (banner: ScottPromotionalBanner) => {
    if (banner.rmp_brand?.name) return banner.rmp_brand.name;
    if (banner.rmp_brand_id) return brandById.get(banner.rmp_brand_id)?.name || '—';
    return '—';
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleAdd = () => {
    setSelectedBanner(null);
    setDialogOpen(true);
  };

  const handleEdit = (banner: ScottPromotionalBanner) => {
    setSelectedBanner(banner);
    setDialogOpen(true);
  };

  const handleDelete = async (banner: ScottPromotionalBanner) => {
    if (window.confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      deletePromotionalBannerMutation.mutate(banner.id);
    }
  };

  const handleExport = async () => {
    const all = await fetchPromotionalBanners();
    if (!all.length) return;

    // Fetch related masters for export resolution
    const [{ data: categories }, { data: classes }, { data: brands }] = await Promise.all([
      import('@/services/masters/rmpCategoriesService').then(m => m.fetchRmpCategories()),
      import('@/services/masters/rmpClassesService').then(m => m.fetchRmpClasses()),
      import('@/services/masters/rmpBrandsService').then(m => m.fetchRmpBrands()),
    ]);

    const catById = new Map((categories || []).map(c => [c.id, c]));
    const clsById = new Map((classes || []).map(c => [c.id, c]));
    const brdById = new Map((brands || []).map(b => [b.id, b]));

    const resolveCategoryExport = (item: ScottPromotionalBanner) => {
      if (item.rmp_category?.name) return item.rmp_category.name;
      if (item.rmp_category_id) return catById.get(item.rmp_category_id)?.name || '—';
      return '—';
    };

    const resolveClassExport = (item: ScottPromotionalBanner) => {
      if (item.rmp_class?.name) return item.rmp_class.name;
      if (item.rmp_class_id) return clsById.get(item.rmp_class_id)?.name || '—';
      return '—';
    };

    const resolveBrandExport = (item: ScottPromotionalBanner) => {
      if (item.rmp_brand?.name) return item.rmp_brand.name;
      if (item.rmp_brand_id) return brdById.get(item.rmp_brand_id)?.name || '—';
      return '—';
    };

    exportToCSV({
      filename: generateExportFilename('promotional-banners-rmp'),
      headers: ['Title', 'Position', 'Category', 'Class', 'Brand', 'Status', 'Created At', 'Updated At'],
      data: all,
      fieldMap: {
        Title: 'title',
        Position: 'position',
        Category: resolveCategoryExport,
        Class: resolveClassExport,
        Brand: resolveBrandExport,
        Status: 'status',
        'Created At': (item: ScottPromotionalBanner) =>
          new Date(item.created_at).toLocaleDateString(),
        'Updated At': (item: ScottPromotionalBanner) =>
          new Date(item.updated_at).toLocaleDateString(),
      },
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Title', 'Position', 'Status', 'RMP Category ID', 'RMP Class ID', 'RMP Brand ID'];
  const sampleData = [
    ['Summer Sale Banner', '1', 'active', '42', '10', '682'],
    ['Winter Collection', '2', 'active', '', '', '682'],
  ];

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={10}
        header={
          <MasterPageHeader
            title="Promotional Banners (RMP)"
            description="Manage RMP promotional banners with category, class and brand targeting"
            icon={<Megaphone className="h-6 w-6 text-purple-600" />}
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            canExport={!!bannersPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Promotional Banners (RMP)"
        description="Manage RMP promotional banners with category, class and brand targeting"
        icon={<Megaphone className="h-6 w-6 text-purple-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={promotionalBanners.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search promotional banners..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={promotionalBanners.length}
            totalCount={
              bannersPage?.totalCountIsExact ? bannersPage.totalCount : promotionalBanners.length
            }
          />

          <div className="mt-6">
            {promotionalBanners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{searchTerm ? 'No promotional banners match your search' : 'No promotional banners found'}</p>
                <p className="text-sm">{searchTerm ? 'Try a different search term' : 'Add an RMP banner to get started'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotionalBanners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        {banner.image_url ? (
                          <img
                            src={proxifyScottImageUrl(banner.image_url)}
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
                      <TableCell>{banner.position}</TableCell>
                      <TableCell>{resolveCategory(banner)}</TableCell>
                      <TableCell>{resolveClass(banner)}</TableCell>
                      <TableCell>{resolveBrand(banner)}</TableCell>
                      <TableCell>
                        <Badge variant={banner.status === 'active' ? 'default' : 'secondary'}>
                          {banner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(banner.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(banner.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                            disabled={deletePromotionalBannerMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(banner)}
                            disabled={deletePromotionalBannerMutation.isPending}
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
          <MasterServerPagination
            result={bannersPage ?? null}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            disabled={isFetching}
            className="mt-4"
          />
        </CardContent>
      </Card>

      <ScottPromotionalBannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={selectedBanner}
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

export default ScottPromotionalBannersPage;

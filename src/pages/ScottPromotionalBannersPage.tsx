import React, { useState, useEffect } from 'react';

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
} from '@/hooks/masters/useScottPromotionalBanners';
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
  const [selectedBanner, setSelectedBanner] = useState<ScottPromotionalBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: bannersPage, isLoading, isFetching } = useScottPromotionalBanners(page, pageSize);
  const promotionalBanners = bannersPage?.data ?? [];
  const deletePromotionalBannerMutation = useDeleteScottPromotionalBanner();

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredBanners = promotionalBanners.filter(
    (banner) =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.rmp_category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.rmp_class?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.rmp_brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

    exportToCSV({
      filename: generateExportFilename('promotional-banners-rmp'),
      headers: ['Title', 'Position', 'Category', 'Class', 'Brand', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        Title: 'title',
        Position: 'position',
        Category: (item: ScottPromotionalBanner) => item.rmp_category?.name || '—',
        Class: (item: ScottPromotionalBanner) => item.rmp_class?.name || '—',
        Brand: (item: ScottPromotionalBanner) => item.rmp_brand?.name || '—',
        Status: 'status',
        'Created At': (item: ScottPromotionalBanner) =>
          new Date(item.created_at).toLocaleDateString(),
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
        columnCount={7}
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
        canExport={filteredBanners.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search promotional banners (current page)..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredBanners.length}
            totalCount={
              bannersPage?.totalCountIsExact ? bannersPage.totalCount : promotionalBanners.length
            }
          />

          <div className="mt-6">
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No promotional banners on this page</p>
                <p className="text-sm">Try another page or add an RMP banner</p>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
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
                      <TableCell>{banner.rmp_category?.name || '—'}</TableCell>
                      <TableCell>{banner.rmp_class?.name || '—'}</TableCell>
                      <TableCell>{banner.rmp_brand?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={banner.status === 'active' ? 'default' : 'secondary'}>
                          {banner.status}
                        </Badge>
                      </TableCell>
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

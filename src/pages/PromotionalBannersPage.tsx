import React, { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import PromotionalBannerDialog from '@/components/masters/PromotionalBannerDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { usePromotionalBanners, useDeletePromotionalBanner } from '@/hooks/masters/usePromotionalBanners';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import type { PromotionalBanner } from '@/services/masters/types';

const PromotionalBannersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBanner, setSelectedBanner] = useState<PromotionalBanner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: promotionalBanners = [], isLoading } = usePromotionalBanners();
  const deletePromotionalBannerMutation = useDeletePromotionalBanner();

  const filteredBanners = promotionalBanners.filter(
    (banner) =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.category_label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.link || '').toLowerCase().includes(searchTerm.toLowerCase()),
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
      filename: generateExportFilename('catalogue-promotions'),
      headers: ['Name', 'Link', 'Category', 'Upload date', 'Status', 'Created At'],
      data: promotionalBanners,
      fieldMap: {
        Name: 'title',
        Link: 'link',
        Category: 'category_label',
        'Upload date': 'upload_date',
        Status: 'status',
        'Created At': (item: PromotionalBanner) =>
          new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Title', 'Link', 'Category', 'Upload date', 'Status'];
  const sampleData = [
    ['Summer catalogue', 'https://example.com/cat', 'Catalogues', '', 'active'],
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p>Loading catalogue promotions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Catalogue promotions"
        description="Manage Scott dashboard catalogue promotions (name, link, category, thumbnail)"
        icon={<ImageIcon className="h-6 w-6 text-purple-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={filteredBanners.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search promotions..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredBanners.length}
            totalCount={promotionalBanners.length}
          />

          <div className="mt-6">
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No promotions found</p>
                <p className="text-sm">Click Add to create a catalogue promotion</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Category</TableHead>
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
                      <TableCell className="max-w-[200px] truncate">
                        {banner.link ? (
                          <a
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {banner.link}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{banner.category_label || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={banner.status === 'active' ? 'default' : 'secondary'}>
                          {banner.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
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

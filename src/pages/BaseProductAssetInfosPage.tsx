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
import BaseProductAssetInfoDialog from '@/components/masters/BaseProductAssetInfoDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import {
  useBaseProductAssetInfos,
  useDeleteBaseProductAssetInfo,
  type BaseProductAssetInfo,
} from '@/hooks/masters/useBaseProductAssetInfos';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { Edit, Trash2, Link2 } from 'lucide-react';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchBaseProductAssetInfos } from '@/services/masters/baseProductAssetInfosService';
import { config } from '@/config/environment';

const BaseProductAssetInfosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<BaseProductAssetInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: assetInfosPage, isLoading, isFetching } = useBaseProductAssetInfos(page, pageSize);
  const assetInfos = assetInfosPage?.data ?? [];
  const deleteAssetInfoMutation = useDeleteBaseProductAssetInfo();

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredAssetInfos = assetInfos.filter(
    (assetInfo) =>
      assetInfo.base_product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetInfo.add_on?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetInfo.part?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetInfo.asset_info?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetInfo.base_product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedAssetInfo(null);
    setDialogOpen(true);
  };

  const handleEdit = (assetInfo: BaseProductAssetInfo) => {
    setSelectedAssetInfo(assetInfo);
    setDialogOpen(true);
  };

  const handleDelete = async (assetInfo: BaseProductAssetInfo) => {
    if (window.confirm(`Are you sure you want to delete this asset link?`)) {
      deleteAssetInfoMutation.mutate(assetInfo.id);
    }
  };

  const handleExport = async () => {
    const all = await fetchBaseProductAssetInfos();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('base-product-asset-links'),
      headers: ['Base Product', 'Add On', 'Part', 'Asset Info', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Base Product': (item: BaseProductAssetInfo) => item.base_product?.name || item.base_product_id,
        'Add On': (item: BaseProductAssetInfo) => item.add_on?.name || item.add_on_id,
        'Part': (item: BaseProductAssetInfo) => item.part?.name || item.part_id,
        'Asset Info': (item: BaseProductAssetInfo) => item.asset_info?.name || item.asset_info_id,
        'Status': (item: BaseProductAssetInfo) => (item.is_deleted ? 'inactive' : 'active'),
        'Created At': (item: BaseProductAssetInfo) =>
          new Date(item.created_at).toLocaleDateString(),
      },
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Base Product ID', 'Add On ID', 'Part ID', 'Asset Info ID'];
  const sampleData = [
    ['210', '641', '118', '6'],
    ['211', '642', '119', '7'],
  ];

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={6}
        header={
          <MasterPageHeader
            title="Base Product Asset Links"
            description="Manage links between base products, add-ons, parts, and asset infos"
            icon={<Link2 className="h-6 w-6 text-amber-600" />}
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            canExport={!!assetInfosPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Base Product Asset Links"
        description="Manage links between base products, add-ons, parts, and asset infos"
        icon={<Link2 className="h-6 w-6 text-amber-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={filteredAssetInfos.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search asset links (current page)..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredAssetInfos.length}
            totalCount={
              assetInfosPage?.totalCountIsExact ? assetInfosPage.totalCount : assetInfos.length
            }
          />

          <div className="mt-6">
            {filteredAssetInfos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No asset links on this page</p>
                <p className="text-sm">Try another page or add a link</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Base Product</TableHead>
                    <TableHead>Add On</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Asset Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssetInfos.map((assetInfo) => (
                    <TableRow key={assetInfo.id}>
                      <TableCell className="font-medium">
                        {assetInfo.base_product?.name || assetInfo.base_product_id}
                      </TableCell>
                      <TableCell>
                        {assetInfo.add_on?.name || assetInfo.add_on_id}
                      </TableCell>
                      <TableCell>
                        {assetInfo.part?.name || assetInfo.part_id}
                      </TableCell>
                      <TableCell>
                        {assetInfo.asset_info?.name || assetInfo.asset_info_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={!assetInfo.is_deleted ? 'default' : 'secondary'}>
                          {!assetInfo.is_deleted ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(assetInfo)}
                            disabled={deleteAssetInfoMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(assetInfo)}
                            disabled={deleteAssetInfoMutation.isPending}
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
            result={assetInfosPage ?? null}
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

      <BaseProductAssetInfoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assetInfo={selectedAssetInfo}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="baseProductAssetInfos"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default BaseProductAssetInfosPage;

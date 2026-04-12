import React, { useState, useEffect, useMemo, useCallback } from 'react';

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
  type BaseProductAssetInfoFilter,
} from '@/hooks/masters/useBaseProductAssetInfos';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { Edit, Trash2, Link2 } from 'lucide-react';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { fetchBaseProductAssetInfos } from '@/services/masters/baseProductAssetInfosService';
import { fetchBaseProducts } from '@/services/masters/baseProductsServiceScott';
import { fetchAddOns } from '@/services/masters/addOnsServiceScott';
import { fetchParts } from '@/services/masters/partsServiceScott';
import { getAppAssets } from '@/services/masters/appAssetsService';
import { useAllBaseProducts } from '@/hooks/masters/useBaseProducts';
import { useAllAddOns } from '@/hooks/masters/useAddOns';
import { useAllParts } from '@/hooks/masters/useParts';
import { useAllAppAssets } from '@/hooks/masters/useAppAssets';
import { config } from '@/config/environment';

const BaseProductAssetInfosPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const filters: BaseProductAssetInfoFilter | undefined = searchTerm ? { search: searchTerm } : undefined;
  const [selectedAssetInfo, setSelectedAssetInfo] = useState<BaseProductAssetInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: assetInfosPage, isLoading, isFetching } = useBaseProductAssetInfos(page, pageSize, filters);
  const assetInfos = assetInfosPage?.data ?? [];
  const deleteAssetInfoMutation = useDeleteBaseProductAssetInfo();

  const { data: baseProducts = [] } = useAllBaseProducts();
  const { data: addOns = [] } = useAllAddOns();
  const { data: parts = [] } = useAllParts();
  const { data: appAssets = [] } = useAllAppAssets();

  const baseProductById = useMemo(
    () => new Map(baseProducts.map((p) => [p.id, p] as const)),
    [baseProducts],
  );
  const addOnById = useMemo(() => new Map(addOns.map((a) => [a.id, a] as const)), [addOns]);
  const partById = useMemo(() => new Map(parts.map((p) => [p.id, p] as const)), [parts]);
  const assetInfoById = useMemo(
    () => new Map(appAssets.map((a) => [a.id, a] as const)),
    [appAssets],
  );

  const labelBaseProduct = useCallback(
    (row: BaseProductAssetInfo) => {
      const full = row.base_product_id ? baseProductById.get(row.base_product_id) : undefined;
      const resolved = full ?? row.base_product;
      return resolved?.name?.trim() || row.base_product_id || '-';
    },
    [baseProductById],
  );
  const labelAddOn = useCallback(
    (row: BaseProductAssetInfo) => {
      const full = row.add_on_id ? addOnById.get(row.add_on_id) : undefined;
      const resolved = full ?? row.add_on;
      return resolved?.name?.trim() || row.add_on_id || '-';
    },
    [addOnById],
  );
  const labelPart = useCallback(
    (row: BaseProductAssetInfo) => {
      const full = row.part_id ? partById.get(row.part_id) : undefined;
      const resolved = full ?? row.part;
      return resolved?.name?.trim() || row.part_id || '-';
    },
    [partById],
  );
  const labelAssetInfo = useCallback(
    (row: BaseProductAssetInfo) => {
      const full = row.asset_info_id ? assetInfoById.get(row.asset_info_id) : undefined;
      const resolved = full ?? row.asset_info;
      return resolved?.name?.trim() || row.asset_info_id || '-';
    },
    [assetInfoById],
  );

  // Reset to page 1 when search changes (API handles the search filtering)
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

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
    const [all, bps, aos, pts, assets] = await Promise.all([
      fetchBaseProductAssetInfos(),
      fetchBaseProducts(),
      fetchAddOns(),
      fetchParts(),
      getAppAssets(),
    ]);
    if (!all.length) return;

    const bpMap = new Map(bps.map((p) => [p.id, p] as const));
    const aoMap = new Map(aos.map((a) => [a.id, a] as const));
    const ptMap = new Map(pts.map((p) => [p.id, p] as const));
    const aiMap = new Map(assets.map((a) => [a.id, a] as const));

    const exportBp = (item: BaseProductAssetInfo) => {
      const full = item.base_product_id ? bpMap.get(item.base_product_id) : undefined;
      return (full ?? item.base_product)?.name?.trim() || item.base_product_id || '-';
    };
    const exportAo = (item: BaseProductAssetInfo) => {
      const full = item.add_on_id ? aoMap.get(item.add_on_id) : undefined;
      return (full ?? item.add_on)?.name?.trim() || item.add_on_id || '-';
    };
    const exportPt = (item: BaseProductAssetInfo) => {
      const full = item.part_id ? ptMap.get(item.part_id) : undefined;
      return (full ?? item.part)?.name?.trim() || item.part_id || '-';
    };
    const exportAi = (item: BaseProductAssetInfo) => {
      const full = item.asset_info_id ? aiMap.get(item.asset_info_id) : undefined;
      return (full ?? item.asset_info)?.name?.trim() || item.asset_info_id || '-';
    };

    exportToCSV({
      filename: generateExportFilename('base-product-asset-links'),
      headers: ['Base Product', 'Add On', 'Part', 'Asset Info', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Base Product': exportBp,
        'Add On': exportAo,
        'Part': exportPt,
        'Asset Info': exportAi,
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
        columnCount={8}
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
        canExport={assetInfos.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search asset links..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={assetInfos.length}
            totalCount={
              assetInfosPage?.totalCountIsExact ? assetInfosPage.totalCount : assetInfos.length
            }
          />

          <div className="mt-6">
            {assetInfos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{searchTerm ? 'No asset links match your search' : 'No asset links found'}</p>
                <p className="text-sm">{searchTerm ? 'Try a different search term' : 'Add a link to get started'}</p>
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
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetInfos.map((assetInfo) => (
                    <TableRow key={assetInfo.id}>
                      <TableCell className="font-medium">
                        {labelBaseProduct(assetInfo)}
                      </TableCell>
                      <TableCell>
                        {labelAddOn(assetInfo)}
                      </TableCell>
                      <TableCell>
                        {labelPart(assetInfo)}
                      </TableCell>
                      <TableCell>
                        {labelAssetInfo(assetInfo)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={!assetInfo.is_deleted ? 'default' : 'secondary'}>
                          {!assetInfo.is_deleted ? 'active' : 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(assetInfo.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(assetInfo.updated_at).toLocaleDateString()}</TableCell>
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

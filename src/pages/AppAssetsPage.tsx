
import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Edit, Trash2 } from 'lucide-react';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAppAssets, useDeleteAppAsset } from '@/hooks/masters/useAppAssets';
import AppAssetDialog from '@/components/masters/AppAssetDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import type { AppAsset } from '@/services/masters/appAssetsService';
import { getAppAssets } from '@/services/masters/appAssetsService';
import { MasterListPageSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { config } from '@/config/environment';

const AppAssetsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AppAsset | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: appAssetsPage, isLoading, isFetching } = useGetAppAssets(page, pageSize);
  const appAssets = appAssetsPage?.data ?? [];
  const deleteAppAssetMutation = useDeleteAppAsset();

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const filteredAssets = appAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedAsset(null);
    setDialogOpen(true);
  };

  const handleEdit = (asset: AppAsset) => {
    setSelectedAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = async (asset: AppAsset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteAppAssetMutation.mutate(asset.id);
    }
  };

  const handleExport = async () => {
    const all = await getAppAssets();
    if (!all.length) return;

    exportToCSV({
      filename: generateExportFilename('app-assets'),
      headers: ['Name', 'dX', 'dY', 'Mirror dX', 'Height Resp', 'Connected Add-On', 'Status', 'Created At'],
      data: all,
      fieldMap: {
        'Name': 'name',
        'dX': 'dx',
        'dY': 'dy',
        'Mirror dX': 'mirror_dx',
        'Height Resp': 'asset_height_resp_to_box',
        'Connected Add-On': (item: AppAsset) => item.add_on?.name || '-',
        'Status': 'status',
        'Created At': (item: AppAsset) => new Date(item.created_at).toLocaleDateString()
      }
    });
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Name', 'dX', 'dY', 'Mirror dX', 'Height Resp', 'Connected Add-On', 'Status'];
  const sampleData = [
    ['Logo Icon', '10.5', '15.2', '8.3', '100.0', 'Premium Quality', 'active'],
    ['Banner Image', '0.0', '0.0', '0.0', '75.5', '', 'active']
  ];

  if (isLoading) {
    return (
      <MasterListPageSkeleton
        columnCount={7}
        header={
          <MasterPageHeader
            title="App Assets"
            description="Manage application assets, icons, and media resources"
            icon={<Smartphone className="h-6 w-6 text-sky-600" />}
            onAdd={handleAdd}
            onExport={handleExport}
            onImport={handleImport}
            canExport={!!appAssetsPage?.data.length}
            isScottApi={true}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="App Assets"
        description="Manage application assets, icons, and media resources"
        icon={<Smartphone className="h-6 w-6 text-sky-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={filteredAssets.length > 0}
        isScottApi={true}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search app assets (current page)..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredAssets.length}
            totalCount={
              appAssetsPage?.totalCountIsExact ? appAssetsPage.totalCount : appAssets.length
            }
          />
          
          <div className="mt-6">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No app assets on this page</p>
                <p className="text-sm">Try another page or add an app asset</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>dX</TableHead>
                    <TableHead>dY</TableHead>
                    <TableHead>Mirror dX</TableHead>
                    <TableHead>Height Resp</TableHead>
                    <TableHead>Connected Add-On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        {asset.asset ? (
                          <img
                            src={asset.asset}
                            alt={asset.name}
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.dx}</TableCell>
                      <TableCell>{asset.dy}</TableCell>
                      <TableCell>{asset.mirror_dx}</TableCell>
                      <TableCell>{asset.asset_height_resp_to_box}</TableCell>
                      <TableCell>
                        {asset.add_on ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {asset.add_on.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          asset.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {asset.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset)}
                            disabled={deleteAppAssetMutation.isPending}
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
            result={appAssetsPage ?? null}
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

      <AppAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appAsset={selectedAsset}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="appAssets"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default AppAssetsPage;

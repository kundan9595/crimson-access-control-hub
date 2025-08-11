import React, { useState, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import PromotionalAssetDialog from '@/components/masters/PromotionalAssetDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { usePromotionalAssets, useDeletePromotionalAsset } from '@/hooks/masters/usePromotionalAssets';
import { PromotionalAsset } from '@/services/masters/types';
import { Edit, Trash2, ExternalLink, ImageIcon } from 'lucide-react';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { toast } from 'sonner';

const PromotionalAssetsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<PromotionalAsset | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: promotionalAssets = [], isLoading } = usePromotionalAssets();
  const deleteMutation = useDeletePromotionalAsset();

  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) {
      return promotionalAssets;
    }
    
    const term = searchTerm.toLowerCase();
    return promotionalAssets.filter(asset => 
      asset.name.toLowerCase().includes(term) ||
      asset.type.toLowerCase().includes(term) ||
      (asset.link && asset.link.toLowerCase().includes(term))
    );
  }, [promotionalAssets, searchTerm]);

  const handleAdd = () => {
    setSelectedAsset(null);
    setDialogOpen(true);
  };

  const handleEdit = (asset: PromotionalAsset) => {
    setSelectedAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = async (asset: PromotionalAsset) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(asset.id);
      } catch (error) {
        console.error('Error deleting promotional asset:', error);
      }
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Type', 'Link', 'Status', 'Created At'];
    const fieldMap = {
      'Name': 'name',
      'Type': 'type',
      'Link': 'link',
      'Status': 'status',
      'Created At': (item: PromotionalAsset) => new Date(item.created_at).toLocaleDateString()
    };

    exportToCSV({
      filename: generateExportFilename('promotional-assets'),
      headers,
      data: promotionalAssets,
      fieldMap
    });
    toast.success('Promotional assets exported successfully');
  };

  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const templateHeaders = ['Name', 'Type', 'Link', 'Status'];
  const sampleData = [
    ['Summer Collection Video', 'Video', 'https://example.com/video', 'active'],
    ['Product Catalogue', 'Catalogue', 'https://example.com/catalogue', 'active'],
    ['Lifestyle Photos', 'Lifestyle Images', 'https://example.com/photos', 'active']
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p>Loading promotional assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Promotional Assets"
        description="Manage promotional assets including videos, catalogues, and images"
        icon={<ImageIcon className="h-6 w-6 text-blue-600" />}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        canExport={filteredAssets.length > 0}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search promotional assets..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredAssets.length}
            totalCount={promotionalAssets.length}
          />
          
          <div className="mt-6">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No promotional assets found</p>
                <p className="text-sm">Click "Add Promotional Asset" to create your first asset</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        {asset.thumbnail ? (
                          <img 
                            src={asset.thumbnail} 
                            alt={asset.name}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{asset.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {asset.link ? (
                          <div className="flex items-center space-x-2">
                            <a 
                              href={asset.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <span className="truncate max-w-[200px]">{asset.link}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No link</span>
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
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(asset)}
                            disabled={deleteMutation.isPending}
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

      <PromotionalAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotionalAsset={selectedAsset}
      />

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="promotionalAssets"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default PromotionalAssetsPage; 
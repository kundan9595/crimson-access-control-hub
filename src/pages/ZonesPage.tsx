
import React, { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, MapPin } from 'lucide-react';
import { useZones, useDeleteZone } from '@/hooks/useMasters';
import { Zone } from '@/services/mastersService';
import { useSearchParams } from 'react-router-dom';
import ZoneDialog from '@/components/masters/ZoneDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';
import { MasterPageHeader } from '@/components/masters/shared/MasterPageHeader';
import { SearchFilter } from '@/components/masters/shared/SearchFilter';

const ZonesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const { data: zones, isLoading } = useZones();
  const deleteZone = useDeleteZone();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const filteredZones = zones?.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.locations?.some(location => 
      location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      deleteZone.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingZone(null);
    // Only clear search params if they contain 'add=true'
    if (searchParams.get('add') === 'true') {
      setSearchParams({});
    }
  };

  const handleExport = () => {
    if (!filteredZones?.length) return;

    const csvContent = [
      ['Name', 'Status', 'Locations', 'Created Date'].join(','),
      ...filteredZones.map(zone => [
        `"${zone.name}"`,
        zone.status,
        `"${zone.locations?.map(loc => `${loc.state}, ${loc.city}`).join('; ') || ''}"`,
        new Date(zone.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templateHeaders = ['Name', 'Status'];
  const sampleData = [
    ['North Zone', 'active'],
    ['South Zone', 'active']
  ];

  if (isLoading) {
    return <div className="text-center">Loading zones...</div>;
  }

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Zones"
        description="Manage geographical zones and their locations"
        icon={<MapPin className="h-6 w-6 text-blue-600" />}
        onAdd={() => setIsDialogOpen(true)}
        onExport={handleExport}
        onImport={() => setIsBulkImportOpen(true)}
        canExport={!!filteredZones?.length}
      />

      <Card>
        <CardContent className="p-6">
          <SearchFilter
            placeholder="Search zones..."
            value={searchTerm}
            onChange={setSearchTerm}
            resultCount={filteredZones.length}
            totalCount={zones?.length || 0}
          />
          
          <div className="mt-6">
            {filteredZones.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Created At</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>
                        {zone.locations && zone.locations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {zone.locations.slice(0, 2).map((location, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {location.state}, {location.city}
                              </Badge>
                            ))}
                            {zone.locations.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{zone.locations.length - 2} more
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No locations</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                          {zone.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(zone.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(zone)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(zone.id)}
                            disabled={deleteZone.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No zones found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ZoneDialog
        zone={editingZone}
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        type="zones"
        templateHeaders={templateHeaders}
        sampleData={sampleData}
      />
    </div>
  );
};

export default ZonesPage;

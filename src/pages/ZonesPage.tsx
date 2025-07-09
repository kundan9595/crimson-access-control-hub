
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, MapPin, ArrowLeft, Download, Upload } from 'lucide-react';
import { useZones, useDeleteZone } from '@/hooks/useMasters';
import { Zone } from '@/services/mastersService';
import { useSearchParams, Link } from 'react-router-dom';
import ZoneDialog from '@/components/masters/ZoneDialog';
import BulkImportDialog from '@/components/masters/BulkImportDialog';

const ZonesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('add') === 'true');
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
  const { data: zones, isLoading } = useZones();
  const deleteZone = useDeleteZone();

  const filteredZones = zones?.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.locations?.some(location => 
      location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
    setSearchParams({});
  };

  const handleExport = () => {
    if (!filteredZones?.length) return;

    const csvContent = [
      ['Name', 'Code', 'Description', 'Status', 'Locations', 'Created Date'].join(','),
      ...filteredZones.map(zone => [
        `"${zone.name}"`,
        `"${zone.code || ''}"`,
        `"${zone.description || ''}"`,
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

  const templateHeaders = ['Name', 'Code', 'Description', 'Status'];
  const sampleData = [
    ['North Zone', 'NZ001', 'Northern region coverage', 'active'],
    ['South Zone', 'SZ001', 'Southern region coverage', 'active']
  ];

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/masters">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Masters
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              Zones
            </h1>
            <p className="text-muted-foreground">Manage geographical zones and their locations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!filteredZones?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Zones</CardTitle>
          <CardDescription>Find zones by name or location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredZones?.map((zone) => (
          <Card key={zone.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{zone.name}</h3>
                    <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                      {zone.status}
                    </Badge>
                  </div>
                  
                  {zone.locations && zone.locations.length > 0 ? (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Locations:</h4>
                      <div className="flex flex-wrap gap-2">
                        {zone.locations.map((location, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {location.state}, {location.city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">No locations assigned</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(zone.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredZones?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Zones Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No zones match your search criteria.' : 'Get started by creating your first zone.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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

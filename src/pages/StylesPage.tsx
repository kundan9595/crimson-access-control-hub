
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { StylesList } from '@/components/masters/StylesList';
import { StyleDialog } from '@/components/masters/StyleDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const StylesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Styles</h1>
          <p className="text-muted-foreground">
            Manage your product styles and their variations
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Style
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Styles</CardTitle>
        </CardHeader>
        <CardContent>
          <StylesList />
        </CardContent>
      </Card>

      <ErrorBoundary>
        <StyleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </ErrorBoundary>
    </div>
  );
};

export default StylesPage;

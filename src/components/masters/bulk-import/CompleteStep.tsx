
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CompleteStepProps = {
  type: string;
  onClose: () => void;
  dependencySummary?: {
    created: Record<string, number>;
    updated: Record<string, number>;
  };
};

const CompleteStep: React.FC<CompleteStepProps> = ({ type, onClose, dependencySummary }) => {
  const hasDependencies = dependencySummary && (
    Object.keys(dependencySummary.created).length > 0 || 
    Object.keys(dependencySummary.updated).length > 0
  );

  return (
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      <div>
        <h3 className="text-lg font-semibold">Import Completed Successfully!</h3>
        <p className="text-muted-foreground">
          Your {type} have been imported and are now available.
        </p>
      </div>

      {hasDependencies && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Dependencies Processed</CardTitle>
            <CardDescription>
              The following dependent masters were automatically created or updated:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dependencySummary.created).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-2">Created:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dependencySummary.created).map(([table, count]) => (
                      <Badge key={table} variant="secondary" className="text-green-700 bg-green-100">
                        {count} {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {Object.entries(dependencySummary.updated).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-600 mb-2">Updated:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dependencySummary.updated).map(([table, count]) => (
                      <Badge key={table} variant="secondary" className="text-blue-700 bg-blue-100">
                        {count} {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={onClose}>
        Close
      </Button>
    </div>
  );
};

export default CompleteStep;

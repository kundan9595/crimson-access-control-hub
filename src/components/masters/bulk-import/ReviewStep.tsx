
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingResult, BulkImportType } from './types';
import { downloadCSV } from './csvUtils';

type ReviewStepProps = {
  type: BulkImportType;
  processingResult: ProcessingResult;
  templateHeaders: string[];
  isProcessing: boolean;
  onStartOver: () => void;
  onConfirmImport: () => void;
};

const ReviewStep: React.FC<ReviewStepProps> = ({
  type,
  processingResult,
  templateHeaders,
  isProcessing,
  onStartOver,
  onConfirmImport
}) => {
  const downloadInvalidRecords = () => {
    if (!processingResult?.invalidRecords.length) return;

    const csvContent = [
      [...templateHeaders, 'Errors'].join(','),
      ...processingResult.invalidRecords.map(record => [
        ...record.data.map(cell => `"${cell}"`),
        `"${record.errors.join('; ')}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvContent, `${type}-invalid-records.csv`);
  };

  const getPreviewText = (record: any): string => {
    switch (type) {
      case 'colors':
        return `${record.name} (${record.hex_code})`;
      case 'vendors':
        return `${record.name} (${record.code})`;
      case 'classes':
        return `${record.name} - Tax: ${record.tax_percentage}%`;
      case 'skus':
        return `${record.sku_code} - MRP: ₹${record.base_mrp || 0}`;
      default:
        return `${record.name} - ${record.description || 'No description'}`;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Valid Records
            </CardTitle>
            <CardDescription>
              Records that passed validation and are ready to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 mb-4">
              {processingResult.validRecords.length}
            </div>
            {processingResult.validRecords.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview (top 5):</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {processingResult.validRecords.slice(0, 5).map((record, index) => (
                    <div key={index} className="text-xs p-2 bg-green-50 rounded border">
                      {getPreviewText(record)}
                    </div>
                  ))}
                  {processingResult.validRecords.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {processingResult.validRecords.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Invalid Records
            </CardTitle>
            <CardDescription>
              Records with validation errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 mb-4">
              {processingResult.invalidRecords.length}
            </div>
            {processingResult.invalidRecords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Preview (top 5):</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadInvalidRecords}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download with Comments
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {processingResult.invalidRecords.slice(0, 5).map((record, index) => (
                    <div key={index} className="text-xs p-2 bg-red-50 rounded border">
                      <div className="font-medium">Row {record.row}: {record.data.join(', ')}</div>
                      <div className="text-red-600 mt-1">{record.errors.join('; ')}</div>
                    </div>
                  ))}
                  {processingResult.invalidRecords.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ...and {processingResult.invalidRecords.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onStartOver}>
          Start Over
        </Button>
        <Button
          onClick={onConfirmImport}
          disabled={processingResult.validRecords.length === 0 || isProcessing}
        >
          {isProcessing ? 'Importing...' : `Import ${processingResult.validRecords.length} Records`}
        </Button>
      </div>
    </>
  );
};

export default ReviewStep;

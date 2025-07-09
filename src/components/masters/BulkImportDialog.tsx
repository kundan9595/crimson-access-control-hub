
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, AlertCircle, CheckCircle, FileText, X } from 'lucide-react';
import { useCreateBrand, useCreateCategory, useCreateColor } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';

type BulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'brands' | 'categories' | 'colors';
  templateHeaders: string[];
  sampleData: string[][];
};

type ValidationResult = {
  valid: boolean;
  errors: string[];
  data?: any;
};

type ProcessingResult = {
  validRecords: any[];
  invalidRecords: Array<{ row: number; data: string[]; errors: string[] }>;
  totalProcessed: number;
};

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onOpenChange,
  type,
  templateHeaders,
  sampleData
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createBrandMutation = useCreateBrand();
  const createCategoryMutation = useCreateCategory();
  const createColorMutation = useCreateColor();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csvContent = [
      templateHeaders.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadInvalidRecords = () => {
    if (!processingResult?.invalidRecords.length) return;

    const csvContent = [
      [...templateHeaders, 'Errors'].join(','),
      ...processingResult.invalidRecords.map(record => [
        ...record.data.map(cell => `"${cell}"`),
        `"${record.errors.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-invalid-records.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (csv: string): string[][] => {
    const lines = csv.trim().split('\n');
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result.map(cell => cell.replace(/^"|"$/g, ''));
    });
  };

  const validateRow = (row: string[], index: number): ValidationResult => {
    const errors: string[] = [];

    if (type === 'brands' || type === 'categories') {
      if (row.length < 2) errors.push('Missing required fields');
      if (!row[0]?.trim()) errors.push('Name is required');
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
    }
    
    if (type === 'colors') {
      if (row.length < 2) errors.push('Missing required fields');
      if (!row[0]?.trim()) errors.push('Name is required');
      if (!row[1]?.trim()) errors.push('Hex code is required');
      if (!/^#[0-9A-Fa-f]{6}$/.test(row[1])) {
        errors.push('Invalid hex code format');
      }
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Create data object for valid records
    let data;
    if (type === 'brands' || type === 'categories') {
      data = {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      if (type === 'categories') {
        (data as any).parent_id = null;
      } else {
        (data as any).logo_url = null;
      }
    } else if (type === 'colors') {
      data = {
        name: row[0].trim(),
        hex_code: row[1].trim(),
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
    }

    return { valid: true, errors: [], data };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const fileContent = await selectedFile.text();
      const rows = parseCSV(fileContent);
      const dataRows = rows.slice(1); // Skip header row

      const validRecords: any[] = [];
      const invalidRecords: Array<{ row: number; data: string[]; errors: string[] }> = [];

      // Validate all rows
      dataRows.forEach((row, index) => {
        const validation = validateRow(row, index);
        if (validation.valid) {
          validRecords.push(validation.data);
        } else {
          invalidRecords.push({
            row: index + 2, // +2 because we skip header and arrays are 0-indexed
            data: row,
            errors: validation.errors
          });
        }
        setUploadProgress(((index + 1) / dataRows.length) * 100);
      });

      setProcessingResult({
        validRecords,
        invalidRecords,
        totalProcessed: dataRows.length
      });

      setStep('review');
    } catch (error) {
      toast({
        title: "File processing failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!processingResult?.validRecords.length) return;

    setIsProcessing(true);
    let successCount = 0;

    try {
      for (const record of processingResult.validRecords) {
        try {
          if (type === 'brands') {
            await createBrandMutation.mutateAsync(record);
          } else if (type === 'categories') {
            await createCategoryMutation.mutateAsync(record);
          } else if (type === 'colors') {
            await createColorMutation.mutateAsync(record);
          }
          successCount++;
        } catch (error) {
          console.error('Import error for record:', record, error);
        }
      }

      toast({
        title: "Import Completed",
        description: `Successfully imported ${successCount} ${type}`,
      });

      setStep('complete');
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setProcessingResult(null);
    setUploadProgress(0);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <>
              <div>
                <Button variant="outline" onClick={downloadTemplate} className="mb-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <p className="text-sm text-muted-foreground">
                  Download the CSV template with the correct format and sample data.
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="csvFile">Select CSV File</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Choose File
                  </Button>
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing file... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={processFile}
                  disabled={!selectedFile || isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Process File'}
                </Button>
              </div>
            </>
          )}

          {step === 'review' && processingResult && (
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
                    <div className="text-2xl font-bold text-green-700">
                      {processingResult.validRecords.length}
                    </div>
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
                    <div className="text-2xl font-bold text-red-700">
                      {processingResult.invalidRecords.length}
                    </div>
                    {processingResult.invalidRecords.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadInvalidRecords}
                        className="mt-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Errors
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {processingResult.invalidRecords.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Found {processingResult.invalidRecords.length} records with errors:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {processingResult.invalidRecords.slice(0, 5).map((record, index) => (
                          <div key={index} className="text-sm">
                            Row {record.row}: {record.errors.join(', ')}
                          </div>
                        ))}
                        {processingResult.invalidRecords.length > 5 && (
                          <div className="text-sm font-medium">
                            ...and {processingResult.invalidRecords.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  Start Over
                </Button>
                <Button
                  onClick={confirmImport}
                  disabled={processingResult.validRecords.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Importing...' : `Import ${processingResult.validRecords.length} Records`}
                </Button>
              </div>
            </>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Import Completed Successfully!</h3>
                <p className="text-muted-foreground">
                  Your {type} have been imported and are now available.
                </p>
              </div>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;

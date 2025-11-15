
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { parseCSV } from './bulk-import/csvUtils';
import { validateRowEnhanced } from './bulk-import/enhancedValidation';
import { useImportMutations } from './bulk-import/useImportMutations';
import { createDependencyResolutionService, DuplicateHandlingStrategy } from '@/services/masters/dependencyResolutionService';
import { getMasterConfig, getMasterDependencies, generateCompleteTemplateHeaders } from '@/constants/masterDependencies';
import { supabase } from '@/integrations/supabase/client';
import FileUploadStep from './bulk-import/FileUploadStep';
import ReviewStep from './bulk-import/ReviewStep';
import CompleteStep from './bulk-import/CompleteStep';
import { BulkImportDialogProps, ProcessingResult, BulkImportStep } from './bulk-import/types';

interface EnhancedProcessingResult extends ProcessingResult {
  dependencySummary?: {
    created: Record<string, number>;
    updated: Record<string, number>;
  };
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onOpenChange,
  type
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<EnhancedProcessingResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<BulkImportStep>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'overwrite' | 'ignore'>('overwrite');
  
  const { getMutationForType } = useImportMutations();
  const masterConfig = getMasterConfig(type);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const fileContent = await file.text();
      const rows = parseCSV(fileContent);
      const dataRows = rows.slice(1); // Skip header row

      const validRecords: any[] = [];
      const invalidRecords: Array<{ row: number; data: string[]; errors: string[] }> = [];

      // Validate all rows using enhanced validation
      dataRows.forEach((row, index) => {
        const validation = validateRowEnhanced(row, index, type);
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
      toast.error(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      processFile(file);
    } else {
      toast.error("Please select a CSV file");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Helper function to resolve color names to IDs
  const resolveColorNamesToIds = async (colorNames: string[]): Promise<string[]> => {
    if (!colorNames || colorNames.length === 0) return [];
    
    const { data: colors, error } = await supabase
      .from('colors')
      .select('id, name')
      .in('name', colorNames);
    
    if (error) {
      console.error('Error fetching colors:', error);
      return [];
    }
    
    // Create a map of name to id
    const nameToIdMap = new Map(colors?.map(c => [c.name.toLowerCase(), c.id]) || []);
    
    // Return IDs for the provided names (in order)
    const resolvedIds: string[] = [];
    const notFound: string[] = [];
    
    for (const name of colorNames) {
      const id = nameToIdMap.get(name.toLowerCase());
      if (id) {
        resolvedIds.push(id);
      } else {
        notFound.push(name);
      }
    }
    
    if (notFound.length > 0) {
      toast.warning(`Some colors not found: ${notFound.join(', ')}`);
    }
    
    return resolvedIds;
  };

  const confirmImport = async () => {
    if (!processingResult?.validRecords.length) return;

    setIsProcessing(true);
    let successCount = 0;
    let dependencySummary: { created: Record<string, number>; updated: Record<string, number> } | undefined;

    try {
      const mutation = getMutationForType(type);
      
      // Special handling for fabrics - resolve color names to IDs
      let recordsToImport = processingResult.validRecords;
      if (type === 'fabrics') {
        recordsToImport = await Promise.all(
          processingResult.validRecords.map(async (record) => {
            if (record.color_names && Array.isArray(record.color_names)) {
              const colorIds = await resolveColorNamesToIds(record.color_names);
              const { color_names, ...recordWithoutColorNames } = record;
              return {
                ...recordWithoutColorNames,
                color_ids: colorIds
              };
            }
            return record;
          })
        );
      }
      
      // Check if this master has dependencies
      const dependencies = getMasterDependencies(type);
      
      if (dependencies.length > 0) {
        // Use dependency resolution service with the new strategy format
        const dependencyService = createDependencyResolutionService({ 
          ignore: duplicateStrategy === 'ignore' 
        });
        
        // Resolve dependencies first
        const resolutionResult = await dependencyService.resolveDependencies(type, recordsToImport);
        
        if (!resolutionResult.success) {
          toast.error(`Dependency resolution failed: ${resolutionResult.errors.join(', ')}`);
          return;
        }

        // Transform records with resolved IDs
        const transformedRecords = dependencyService.transformRecordsWithResolvedIds(
          recordsToImport,
          type,
          resolutionResult.resolvedIds
        );

        // Import the main records
        for (const record of transformedRecords) {
          try {
            await mutation.mutateAsync(record);
            successCount++;
          } catch (error) {
            console.error('Import error for record:', record, error);
          }
        }

        dependencySummary = dependencyService.getSummary();
      } else {
        // No dependencies, import directly
        for (const record of recordsToImport) {
          try {
            await mutation.mutateAsync(record);
            successCount++;
          } catch (error) {
            console.error('Import error for record:', record, error);
          }
        }
      }

      // Show success message with dependency summary
      let description = `Successfully imported ${successCount} ${type}`;
      if (dependencySummary) {
        const createdSummary = Object.entries(dependencySummary.created)
          .map(([table, count]) => `${count} ${table}`)
          .join(', ');
        const updatedSummary = Object.entries(dependencySummary.updated)
          .map(([table, count]) => `${count} ${table}`)
          .join(', ');
        
        if (createdSummary || updatedSummary) {
          description += `. Dependencies: ${createdSummary ? `Created: ${createdSummary}` : ''}${updatedSummary ? ` Updated: ${updatedSummary}` : ''}`;
        }
      }

      toast.success(description);

      setProcessingResult(prev => prev ? { ...prev, dependencySummary } : null);
      setStep('complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setProcessingResult(null);
    setUploadProgress(0);
    setStep('upload');
    setIsDragOver(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const renderDependencyInfo = () => {
    if (!masterConfig || masterConfig.independent) return null;

    const dependencies = masterConfig.dependencies;
    if (dependencies.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          This import will automatically create or update the following dependent masters:
        </p>
        <div className="space-y-1">
          {dependencies.map((dep, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">{dep.table}</Badge>
                <span className="text-muted-foreground">
                  {dep.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <span className="text-muted-foreground">
                Lookup by: {dep.nameField}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDuplicateStrategy = () => {
    if (!masterConfig || masterConfig.independent) return null;

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">Duplicate Handling</CardTitle>
          <CardDescription>
            Choose how to handle existing records with the same name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={duplicateStrategy}
            onValueChange={(value: 'overwrite' | 'ignore') => setDuplicateStrategy(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" />
              <Label htmlFor="overwrite" className="text-sm font-normal">
                Overwrite duplicates
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Existing records will be updated with new data
            </p>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ignore" id="ignore" />
              <Label htmlFor="ignore" className="text-sm font-normal">
                Ignore duplicates
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Existing records will be skipped
            </p>
          </RadioGroup>
        </CardContent>
      </Card>
    );
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
              <FileUploadStep
                type={type}
                selectedFile={selectedFile}
                isProcessing={isProcessing}
                uploadProgress={uploadProgress}
                isDragOver={isDragOver}
                onFileSelect={handleFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onCancel={handleClose}
                setIsDragOver={setIsDragOver}
                dependencyInfo={renderDependencyInfo()}
              />
            </>
          )}

          {step === 'review' && processingResult && (
            <>
              {renderDuplicateStrategy()}
              <ReviewStep
                type={type}
                processingResult={processingResult}
                templateHeaders={generateCompleteTemplateHeaders(type).headers}
                isProcessing={isProcessing}
                onStartOver={resetDialog}
                onConfirmImport={confirmImport}
              />
            </>
          )}

          {step === 'complete' && (
            <CompleteStep
              type={type}
              onClose={handleClose}
              dependencySummary={processingResult?.dependencySummary}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;

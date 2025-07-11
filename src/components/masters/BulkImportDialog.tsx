
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { parseCSV } from './bulk-import/csvUtils';
import { validateRow } from './bulk-import/validation';
import { useImportMutations } from './bulk-import/useImportMutations';
import FileUploadStep from './bulk-import/FileUploadStep';
import ReviewStep from './bulk-import/ReviewStep';
import CompleteStep from './bulk-import/CompleteStep';
import { BulkImportDialogProps, ProcessingResult, BulkImportStep } from './bulk-import/types';

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
  const [step, setStep] = useState<BulkImportStep>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { getMutationForType } = useImportMutations();
  const { toast } = useToast();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const fileContent = await file.text();
      const rows = parseCSV(fileContent);
      const dataRows = rows.slice(1); // Skip header row

      const validRecords: any[] = [];
      const invalidRecords: Array<{ row: number; data: string[]; errors: string[] }> = [];

      // Validate all rows
      dataRows.forEach((row, index) => {
        const validation = validateRow(row, index, type);
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

  const handleFileSelect = (file: File) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      processFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
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

  const confirmImport = async () => {
    if (!processingResult?.validRecords.length) return;

    setIsProcessing(true);
    let successCount = 0;

    try {
      const mutation = getMutationForType(type);
      
      for (const record of processingResult.validRecords) {
        try {
          await mutation.mutateAsync(record);
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
    setIsDragOver(false);
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
            <FileUploadStep
              type={type}
              templateHeaders={templateHeaders}
              sampleData={sampleData}
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
            />
          )}

          {step === 'review' && processingResult && (
            <ReviewStep
              type={type}
              processingResult={processingResult}
              templateHeaders={templateHeaders}
              isProcessing={isProcessing}
              onStartOver={resetDialog}
              onConfirmImport={confirmImport}
            />
          )}

          {step === 'complete' && (
            <CompleteStep
              type={type}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;

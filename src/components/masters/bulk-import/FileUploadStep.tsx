
import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Download, CloudUpload } from 'lucide-react';
import { BulkImportType } from './types';
import { createCSVContent, downloadCSV } from './csvUtils';
import { generateCompleteTemplateHeaders, debugTemplateHeaders } from '@/constants/masterDependencies';

type FileUploadStepProps = {
  type: BulkImportType;
  selectedFile: File | null;
  isProcessing: boolean;
  uploadProgress: number;
  isDragOver: boolean;
  onFileSelect: (file: File) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCancel: () => void;
  setIsDragOver: (isDragOver: boolean) => void;
  dependencyInfo?: React.ReactNode;
};

const FileUploadStep: React.FC<FileUploadStepProps> = ({
  type,
  selectedFile,
  isProcessing,
  uploadProgress,
  isDragOver,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onCancel,
  setIsDragOver,
  dependencyInfo
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Debug: Log the generated headers
    debugTemplateHeaders(type);
    
    const { headers, sampleData } = generateCompleteTemplateHeaders(type);
    const csvContent = createCSVContent(headers, sampleData);
    downloadCSV(csvContent, `${type}-template.csv`);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  }, [onDragOver, setIsDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDragLeave(e);
  }, [onDragLeave, setIsDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  }, [onDrop, setIsDragOver]);

  return (
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
        <Label>Drop CSV File or Click to Select</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <CloudUpload className={`h-12 w-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-lg font-medium">
                {isDragOver ? 'Drop your CSV file here' : 'Drop CSV file here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                File will be processed automatically after selection
              </p>
            </div>
            
            {dependencyInfo && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted-foreground/20 w-full max-w-md">
                {dependencyInfo}
              </div>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing file... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export default FileUploadStep;

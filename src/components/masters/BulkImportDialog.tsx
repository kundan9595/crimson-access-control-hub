
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { useCreateBrand, useCreateCategory, useCreateColor } from '@/hooks/useMasters';
import { useToast } from '@/hooks/use-toast';

type BulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'brands' | 'categories' | 'colors';
  templateHeaders: string[];
  sampleData: string[][];
};

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  open,
  onOpenChange,
  type,
  templateHeaders,
  sampleData
}) => {
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
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

  const validateRow = (row: string[], index: number): string | null => {
    if (type === 'brands' || type === 'categories') {
      if (row.length < 2) return `Row ${index + 1}: Missing required fields`;
      if (!row[0]?.trim()) return `Row ${index + 1}: Name is required`;
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        return `Row ${index + 1}: Status must be 'active' or 'inactive'`;
      }
    }
    
    if (type === 'colors') {
      if (row.length < 2) return `Row ${index + 1}: Missing required fields`;
      if (!row[0]?.trim()) return `Row ${index + 1}: Name is required`;
      if (!row[1]?.trim()) return `Row ${index + 1}: Hex code is required`;
      if (!/^#[0-9A-Fa-f]{6}$/.test(row[1])) {
        return `Row ${index + 1}: Invalid hex code format`;
      }
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        return `Row ${index + 1}: Status must be 'active' or 'inactive'`;
      }
    }
    
    return null;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setErrors(['Please enter CSV data']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const rows = parseCSV(csvData);
      const dataRows = rows.slice(1); // Skip header row
      const validationErrors: string[] = [];

      // Validate all rows first
      dataRows.forEach((row, index) => {
        const error = validateRow(row, index);
        if (error) validationErrors.push(error);
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      // Process imports
      let successCount = 0;
      const importErrors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        try {
          if (type === 'brands') {
            await createBrandMutation.mutateAsync({
              name: row[0].trim(),
              description: row[1]?.trim() || null,
              status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive',
              logo_url: null
            });
          } else if (type === 'categories') {
            await createCategoryMutation.mutateAsync({
              name: row[0].trim(),
              description: row[1]?.trim() || null,
              parent_id: null,
              status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
            });
          } else if (type === 'colors') {
            await createColorMutation.mutateAsync({
              name: row[0].trim(),
              hex_code: row[1].trim(),
              status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
            });
          }
          
          successCount++;
        } catch (error) {
          importErrors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Import failed'}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successCount} ${type}`,
        });
      }

      if (importErrors.length > 0) {
        setErrors(importErrors);
      } else {
        onOpenChange(false);
        setCsvData('');
      }
    } catch (error) {
      setErrors([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button variant="outline" onClick={downloadTemplate} className="mb-4">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <p className="text-sm text-muted-foreground">
              Download the CSV template with the correct format and sample data.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvData">CSV Data</Label>
            <Textarea
              id="csvData"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`Paste your CSV data here...\n\nExample:\n${templateHeaders.join(',')}\n${sampleData[0]?.join(',')}`}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={isProcessing || !csvData.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;

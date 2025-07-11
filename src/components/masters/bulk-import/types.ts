
export type BulkImportType = 'brands' | 'categories' | 'colors' | 'sizeGroups' | 'zones' | 'priceTypes' | 'vendors' | 'styles' | 'classes' | 'skus';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  data?: any;
};

export type ProcessingResult = {
  validRecords: any[];
  invalidRecords: Array<{ row: number; data: string[]; errors: string[] }>;
  totalProcessed: number;
};

export type BulkImportStep = 'upload' | 'review' | 'complete';

export type BulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: BulkImportType;
  templateHeaders: string[];
  sampleData: string[][];
};

import type { Column, RenderCellProps, RenderEditCellProps } from 'react-data-grid';

export type BulkEditFieldType =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'enum'
  | 'hex'
  | 'boolean'
  | 'url'
  | 'image'
  | 'images'
  | 'readonly';

export interface EnumOption {
  value: string;
  label: string;
}

export interface ImageColumnConfig {
  /** Accepted MIME types (default: 'image/*'). */
  accept?: string;
  /** Maximum number of files for 'images' type (default: 5). */
  maxFiles?: number;
  /** Maximum file size in bytes (default: 5MB). */
  maxSize?: number;
}

/** Value wrapper for a single image field in bulk edit. */
export interface ImageValue {
  /** Existing URL from the server (if any). */
  existingUrl?: string;
  /** Selected local file (if any). */
  file?: File;
  /** Temporary preview URL for the selected file (auto-generated). */
  previewUrl?: string;
}

/** Value wrapper for a multi-image field in bulk edit. */
export interface ImagesValue {
  /** Existing URLs from the server (if any). */
  existingUrls?: string[];
  /** Selected local files (if any). */
  files?: File[];
  /** Temporary preview URLs for selected files (auto-generated). */
  previewUrls?: string[];
}

export interface BulkEditColumn<TRow> {
  key: keyof TRow & string;
  name: string;
  type: BulkEditFieldType;
  width?: number;
  required?: boolean;
  min?: number;
  max?: number;
  options?: EnumOption[];
  /** Optional editor-only options (subset of `options`). The cell still uses `options` for label lookup. */
  editorOptions?: EnumOption[];
  /** When true, an enum/lookup column may be cleared (renders a "None" entry in the editor). */
  nullable?: boolean;
  /** Optional placeholder for empty values in cells (e.g. "Unassigned"). */
  emptyLabel?: string;
  readonly?: boolean;
  /** Image-specific configuration for 'image' and 'images' field types. */
  imageConfig?: ImageColumnConfig;
  renderCell?: (props: RenderCellProps<TRow>) => React.ReactNode;
  renderEditCell?: (props: RenderEditCellProps<TRow>) => React.ReactNode;
  parseValue?: (value: string) => { value: unknown; valid: boolean; error?: string };
}

export interface BulkEditConfig<TRow, TCreate, TUpdate> {
  title: string;
  columns: BulkEditColumn<TRow>[];
  getRowId: (row: TRow) => string;
  createEmptyRow: () => TRow;
  toCreatePayload: (row: TRow) => TCreate;
  toUpdatePayload: (row: TRow) => TUpdate;
  queryKey: string[];
}

export interface GridRowState<TRow> {
  original: TRow;
  current: TRow;
  isNew: boolean;
  isDeleted: boolean;
  isDirty: boolean;
  validationErrors: Record<string, string>;
}

export interface PasteResult {
  rowIndex: number;
  columnKey: string;
  value: string;
  valid: boolean;
  error?: string;
}

export interface BatchSaveResult {
  created: number;
  updated: number;
  deleted: number;
  failed: number;
  errors: Array<{ rowId: string; operation: 'create' | 'update' | 'delete'; error: string }>;
}

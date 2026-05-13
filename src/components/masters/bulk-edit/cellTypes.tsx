import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Image as ImageIcon, Upload, Trash2, Plus, Check } from 'lucide-react';
import type { RenderCellProps, RenderEditCellProps } from 'react-data-grid';
import type { BulkEditColumn, EnumOption, ImageValue, ImagesValue } from './types';
import { proxifyScottImageUrl } from '@/utils/scottImageProxyUrl';

// ===== Parsers / Validators =====

export const parseText = (value: string, required?: boolean) => {
  const trimmed = value.trim();
  if (required && !trimmed) {
    return { value: trimmed, valid: false, error: 'Required field' };
  }
  return { value: trimmed, valid: true };
};

export const parseInteger = (value: string, min?: number, max?: number) => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return { value: 0, valid: true };
  }
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) {
    return { value: 0, valid: false, error: 'Must be a whole number' };
  }
  if (min !== undefined && num < min) {
    return { value: num, valid: false, error: `Minimum ${min}` };
  }
  if (max !== undefined && num > max) {
    return { value: num, valid: false, error: `Maximum ${max}` };
  }
  return { value: num, valid: true };
};

export const parseDecimal = (value: string, min?: number, max?: number) => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return { value: 0, valid: true };
  }
  const num = parseFloat(trimmed);
  if (isNaN(num)) {
    return { value: 0, valid: false, error: 'Must be a number' };
  }
  if (min !== undefined && num < min) {
    return { value: num, valid: false, error: `Minimum ${min}` };
  }
  if (max !== undefined && num > max) {
    return { value: num, valid: false, error: `Maximum ${max}` };
  }
  return { value: num, valid: true };
};

export const parseHex = (value: string) => {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return { value: '#000000', valid: true };
  }
  let hex = trimmed;
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }
  const hexWithoutHash = hex.slice(1);
  const isValid = /^[0-9A-F]{3}([0-9A-F]{1})?$|^[0-9A-F]{6}([0-9A-F]{2})?$/.test(hexWithoutHash);
  if (!isValid) {
    return { value: hex, valid: false, error: 'Invalid hex color (e.g., #FF5733)' };
  }
  return { value: hex, valid: true };
};

export const parseBoolean = (value: string) => {
  const lower = value.trim().toLowerCase();
  if (['true', 'yes', '1', 'y'].includes(lower)) {
    return { value: true, valid: true };
  }
  if (['false', 'no', '0', 'n', ''].includes(lower)) {
    return { value: false, valid: true };
  }
  return { value: false, valid: false, error: 'Must be true/false, yes/no, or 1/0' };
};

export const parseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: '', valid: true };
  }
  try {
    new URL(trimmed);
    return { value: trimmed, valid: true };
  } catch {
    return { value: trimmed, valid: false, error: 'Invalid URL' };
  }
};

export const parseEnum = (value: string, options: EnumOption[]) => {
  const trimmed = value.trim();
  const match = options.find(
    (o) => o.value.toLowerCase() === trimmed.toLowerCase() || o.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (!match) {
    // Show labels for readability, but include a few example IDs if labels differ
    const labels = options.map((o) => `"${o.label}"`).slice(0, 10);
    const more = options.length > 10 ? ` and ${options.length - 10} more` : '';
    const examples = options.slice(0, 3).map(o => `"${o.label}" (ID: ${o.value})`).join(', ');
    return {
      value: trimmed,
      valid: false,
      error: `Invalid value "${trimmed}". Use: ${labels.join(', ')}${more}. Examples: ${examples}`
    };
  }
  return { value: match.value, valid: true };
};

// ===== Cell Renderers =====

export const TextCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as string;
  return <div className="truncate">{value || '-'}</div>;
};

export const IntegerCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as number;
  return <div className="text-right">{value ?? 0}</div>;
};

export const DecimalCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as number;
  return <div className="text-right">{value ?? 0}</div>;
};

export const EnumCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const col = column as unknown as BulkEditColumn<TRow>;
  const raw = row[column.key as keyof TRow];
  const value = raw == null ? '' : String(raw);
  const option = col.options?.find((o) => o.value === value);
  if (!value) {
    return <span className="text-muted-foreground text-xs">{col.emptyLabel ?? '-'}</span>;
  }
  return (
    <Badge variant="outline" className="font-normal">
      {option?.label ?? value}
    </Badge>
  );
};

export const HexCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as string;
  const hex = value || '#000000';
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded border border-gray-200"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs font-mono">{hex}</span>
    </div>
  );
};

export const BooleanCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as boolean;
  return (
    <div className="flex justify-center">
      {value ? (
        <span className="text-green-600 text-xs">Yes</span>
      ) : (
        <span className="text-gray-400 text-xs">No</span>
      )}
    </div>
  );
};

export const UrlCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow] as string;
  if (!value) return <div className="text-gray-400">-</div>;
  return (
    <div className="truncate text-blue-600 hover:underline cursor-pointer" title={value}>
      {value.length > 30 ? value.slice(0, 30) + '...' : value}
    </div>
  );
};

// ===== Image Cell Renderers =====

/** Helper to get display URL for an ImageValue or string. */
function getImageDisplayUrl(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const iv = value as ImageValue;
  if (iv.previewUrl) return iv.previewUrl;
  if (iv.file) {
    try {
      return URL.createObjectURL(iv.file);
    } catch {
      return undefined;
    }
  }
  return iv.existingUrl;
}

/** Airtable-style single image cell with popover editor */
export const ImageCell = <TRow,>({ column, row, onRowChange }: RenderCellProps<TRow> & { onRowChange?: (row: TRow) => void }) => {
  const rawValue = row[column.key as keyof TRow];
  const displayUrl = getImageDisplayUrl(rawValue);
  const hasNewFile = !!(rawValue as ImageValue)?.file;
  const [open, setOpen] = useState(false);

  const handleChange = (newValue: ImageValue | string) => {
    onRowChange?.({ ...row, [column.key]: newValue });
  };

  const handleClose = (save: boolean) => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-center h-10 w-full cursor-pointer">
          {!displayUrl ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted hover:border-muted-foreground/50 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Add image</span>
            </div>
          ) : (
            <div className="relative group">
              <img
                src={proxifyScottImageUrl(displayUrl)}
                alt=""
                className="h-9 w-9 object-cover rounded-md border shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">
                  {hasNewFile ? 'New' : 'Edit'}
                </span>
              </div>
              {/* New indicator */}
              {hasNewFile && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                  <Check className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="p-0 w-auto border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ImagePopoverEditor
          column={column as unknown as BulkEditColumn<TRow>}
          row={row}
          onRowChange={handleChange}
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  );
};

/** Airtable-style multiple images cell with popover editor */
export const ImagesCell = <TRow,>({ column, row, onRowChange }: RenderCellProps<TRow> & { onRowChange?: (row: TRow) => void }) => {
  const rawValue = row[column.key as keyof TRow] as ImagesValue | undefined;
  const existingCount = rawValue?.existingUrls?.length ?? 0;
  const newCount = rawValue?.files?.length ?? 0;
  const totalCount = existingCount + newCount;
  const [open, setOpen] = useState(false);

  // Get all preview URLs
  const existingUrls = rawValue?.existingUrls ?? [];
  const filePreviews = rawValue?.files?.map((f, i) =>
    rawValue?.previewUrls?.[i] || URL.createObjectURL(f)
  ) ?? [];
  const allUrls = [...existingUrls, ...filePreviews];
  const displayUrls = allUrls.slice(0, 3);
  const remaining = totalCount - displayUrls.length;

  const handleChange = (newValue: ImagesValue) => {
    onRowChange?.({ ...row, [column.key]: newValue });
  };

  const handleClose = (save: boolean) => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center justify-center h-10 w-full cursor-pointer">
          {totalCount === 0 ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground border border-dashed border-muted-foreground/30 hover:bg-muted hover:border-muted-foreground/50 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Add images</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 group">
              {/* Thumbnail stack */}
              <div className="flex -space-x-2">
                {displayUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-md border-2 border-background shadow-sm overflow-hidden ${
                      idx >= existingCount ? 'ring-1 ring-green-500' : ''
                    }`}
                    style={{ zIndex: displayUrls.length - idx }}
                  >
                    <img
                      src={proxifyScottImageUrl(url)}
                      alt=""
                      className="h-7 w-7 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Count badge */}
              <div className="flex items-center gap-1 ml-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {totalCount}
                </span>
                {newCount > 0 && (
                  <span className="text-[10px] text-green-600 font-medium">
                    +{newCount}
                  </span>
                )}
                {remaining > 0 && (
                  <span className="text-xs text-muted-foreground">+{remaining}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="p-0 w-auto border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ImagesPopoverEditor
          column={column as unknown as BulkEditColumn<TRow>}
          row={row}
          onRowChange={handleChange}
          onClose={handleClose}
        />
      </PopoverContent>
    </Popover>
  );
};

export const ReadonlyCell = <TRow,>({ column, row }: RenderCellProps<TRow>) => {
  const value = row[column.key as keyof TRow];
  return (
    <div className="text-gray-400 truncate">
      {typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '-'}
    </div>
  );
};

export const getCellRenderer = <TRow,>(type: string) => {
  switch (type) {
    case 'text':
    case 'url':
      return TextCell<TRow>;
    case 'integer':
      return IntegerCell<TRow>;
    case 'decimal':
      return DecimalCell<TRow>;
    case 'enum':
      return EnumCell<TRow>;
    case 'hex':
      return HexCell<TRow>;
    case 'boolean':
      return BooleanCell<TRow>;
    case 'image':
      return ImageCell<TRow>;
    case 'images':
      return ImagesCell<TRow>;
    case 'readonly':
      return ReadonlyCell<TRow>;
    default:
      return TextCell<TRow>;
  }
};

// ===== Cell Editors =====

interface EditorProps<TRow> extends RenderEditCellProps<TRow> {
  column: BulkEditColumn<TRow>;
}

export const TextEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = (row[column.key as keyof TRow] as string) || '';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onRowChange({ ...row, [column.key]: newValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="h-8 w-full"
      type="text"
    />
  );
};

export const IntegerEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = row[column.key as keyof TRow] as number;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onRowChange({ ...row, [column.key]: 0 });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      onRowChange({ ...row, [column.key]: num });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value ?? 0}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="h-8 w-full text-right"
      type="number"
      step={1}
    />
  );
};

export const DecimalEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = row[column.key as keyof TRow] as number;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onRowChange({ ...row, [column.key]: 0 });
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onRowChange({ ...row, [column.key]: num });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value ?? 0}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="h-8 w-full text-right"
      type="number"
      step="any"
    />
  );
};

/** Sentinel used to represent "no selection" in Radix Select (which disallows empty string values). */
const ENUM_NONE = '__none__';

export const EnumEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const raw = row[column.key as keyof TRow];
  const stored = raw == null ? '' : String(raw);
  const value = stored || ENUM_NONE;
  const editorOptions = column.editorOptions ?? column.options ?? [];
  const allOptions = column.options ?? editorOptions;
  const nullable = column.nullable ?? !column.required;

  // Ensure current value is in options even if it's inactive (not in editorOptions)
  const currentValueInEditorOptions = editorOptions.some((opt) => opt.value === stored);
  const currentOption = !currentValueInEditorOptions && stored
    ? allOptions.find((opt) => opt.value === stored)
    : null;

  // Build final options: include current inactive value first (if needed), then editor options
  const options = currentOption
    ? [{ value: currentOption.value, label: `${currentOption.label} (Inactive)` }, ...editorOptions]
    : editorOptions;

  const handleChange = (newValue: string) => {
    const resolved = newValue === ENUM_NONE ? '' : newValue;
    onRowChange({ ...row, [column.key]: resolved });
    onClose(true);
  };

  return (
    <Select value={value} onValueChange={handleChange} open>
      <SelectTrigger className="h-8 w-full">
        <SelectValue placeholder={column.emptyLabel ?? 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {nullable && (
          <SelectItem value={ENUM_NONE}>
            {column.emptyLabel ?? 'None'}
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const HexEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = (row[column.key as keyof TRow] as string) || '';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onRowChange({ ...row, [column.key]: newValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded border border-gray-200 shrink-0"
        style={{ backgroundColor: value || '#000000' }}
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-8 flex-1"
        type="text"
        placeholder="#RRGGBB"
      />
    </div>
  );
};

export const BooleanEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = row[column.key as keyof TRow] as boolean;

  const handleChange = (checked: boolean) => {
    onRowChange({ ...row, [column.key]: checked });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowChange({ ...row, [column.key]: !value });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full" onKeyDown={handleKeyDown} tabIndex={0} autoFocus>
      <Checkbox checked={value} onCheckedChange={handleChange} />
    </div>
  );
};

export const UrlEditor = <TRow,>({ column, row, onRowChange, onClose }: EditorProps<TRow>) => {
  const value = (row[column.key as keyof TRow] as string) || '';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onRowChange({ ...row, [column.key]: newValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClose(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="h-8 w-full"
      type="url"
      placeholder="https://..."
    />
  );
};

// ===== Image Cell Editors =====

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface PopoverEditorProps<TRow> {
  column: BulkEditColumn<TRow>;
  row: TRow;
  onRowChange: (row: TRow) => void;
  onClose: (save: boolean) => void;
}

/** Airtable-style single image popover editor */
const ImagePopoverEditor = <TRow,>({ column, row, onRowChange, onClose }: PopoverEditorProps<TRow>) => {
  const rawValue = row[column.key as keyof TRow] as ImageValue | string | undefined;
  const config = column.imageConfig;
  const accept = config?.accept ?? 'image/*';
  const maxSize = config?.maxSize ?? DEFAULT_MAX_SIZE;
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize to ImageValue
  const imageValue: ImageValue =
    typeof rawValue === 'string'
      ? { existingUrl: rawValue }
      : rawValue ?? {};

  // Generate preview URL for file if needed
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(imageValue.previewUrl);

  useEffect(() => {
    if (imageValue.file && !previewUrl) {
      const url = URL.createObjectURL(imageValue.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageValue.file, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setError(`File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return;
    }

    setError(null);
    const newPreview = URL.createObjectURL(file);
    setPreviewUrl(newPreview);

    onRowChange({
      ...row,
      [column.key]: {
        existingUrl: imageValue.existingUrl,
        file,
        previewUrl: newPreview,
      } as ImageValue,
    });
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (previewUrl && imageValue.file) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(undefined);
    onRowChange({
      ...row,
      [column.key]: {
        existingUrl: undefined,
        file: undefined,
        previewUrl: undefined,
      } as ImageValue,
    });
  };

  const displayUrl = previewUrl || imageValue.existingUrl;
  const hasImage = !!displayUrl;
  const isNewFile = !!imageValue.file;

  return (
    <div className="p-3 w-[280px]" onClick={(e) => e.stopPropagation()}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main content area */}
      <div className="space-y-3">
        {hasImage ? (
          <>
            {/* Large image preview */}
            <div className="relative group">
              <div className="aspect-square w-full bg-muted rounded-lg overflow-hidden border">
                <img
                  src={proxifyScottImageUrl(displayUrl)}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).className = 'hidden';
                  }}
                />
              </div>

              {/* New file badge */}
              {isNewFile && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  New
                </div>
              )}

              {/* File info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">
                  {imageValue.file?.name || 'Existing image'}
                </p>
                {imageValue.file && (
                  <p className="text-white/80 text-xs">
                    {(imageValue.file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleReplace}
                type="button"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={handleRemove}
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="aspect-square w-full bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:bg-muted hover:border-muted-foreground/50 transition-colors cursor-pointer"
            onClick={handleReplace}
          >
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Max {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => onClose(false)} type="button">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onClose(true)} type="button">
          Done
        </Button>
      </div>
    </div>
  );
};

/** Airtable-style multiple images popover editor */
const ImagesPopoverEditor = <TRow,>({ column, row, onRowChange, onClose }: PopoverEditorProps<TRow>) => {
  const rawValue = row[column.key as keyof TRow] as ImagesValue | undefined;
  const config = column.imageConfig;
  const accept = config?.accept ?? 'image/*';
  const maxSize = config?.maxSize ?? DEFAULT_MAX_SIZE;
  const maxFiles = config?.maxFiles ?? 5;
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagesValue: ImagesValue = rawValue ?? { existingUrls: [], files: [], previewUrls: [] };

  // Generate preview URLs for new files
  const [previewUrls, setPreviewUrls] = useState<string[]>(imagesValue.previewUrls ?? []);

  useEffect(() => {
    const newFiles = imagesValue.files?.filter((f) => !previewUrls.some((_, i) =>
      imagesValue.files?.[i] === f
    )) ?? [];

    if (newFiles.length > 0) {
      const newUrls = newFiles.map((f) => URL.createObjectURL(f));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  }, [imagesValue.files, previewUrls]);

  const existingCount = imagesValue.existingUrls?.length ?? 0;
  const newCount = imagesValue.files?.length ?? 0;
  const totalCount = existingCount + newCount;
  const canAddMore = totalCount < maxFiles;
  const remainingSlots = maxFiles - totalCount;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        newErrors.push(`${file.name}: too large`);
      } else if (totalCount + validFiles.length >= maxFiles) {
        newErrors.push(`Max ${maxFiles} images allowed`);
        break;
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);

    if (validFiles.length > 0) {
      const newPreviewUrls = validFiles.map((f) => URL.createObjectURL(f));
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

      onRowChange({
        ...row,
        [column.key]: {
          existingUrls: imagesValue.existingUrls,
          files: [...(imagesValue.files ?? []), ...validFiles],
          previewUrls: [...previewUrls, ...newPreviewUrls],
        } as ImagesValue,
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number, isExisting: boolean) => {
    if (isExisting) {
      const newExisting = imagesValue.existingUrls?.filter((_, i) => i !== index) ?? [];
      onRowChange({
        ...row,
        [column.key]: {
          ...imagesValue,
          existingUrls: newExisting,
        } as ImagesValue,
      });
    } else {
      const fileIndex = index - existingCount;
      const newFiles = imagesValue.files?.filter((_, i) => i !== fileIndex) ?? [];
      const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

      if (previewUrls[index]) {
        URL.revokeObjectURL(previewUrls[index]);
      }
      setPreviewUrls(newPreviewUrls);

      onRowChange({
        ...row,
        [column.key]: {
          existingUrls: imagesValue.existingUrls,
          files: newFiles,
          previewUrls: newPreviewUrls,
        } as ImagesValue,
      });
    }
  };

  // Build combined list: existing first, then new files
  const allImages = [
    ...(imagesValue.existingUrls?.map((url, i) => ({ url, isExisting: true, index: i })) ?? []),
    ...(previewUrls.slice(0, newCount).map((url, i) => ({ url, isExisting: false, index: existingCount + i }))),
  ];

  return (
    <div className="p-3 w-[320px]" onClick={(e) => e.stopPropagation()}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFilesChange}
        className="hidden"
      />

      {/* Header with count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {totalCount} image{totalCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-muted-foreground">
            (max {maxFiles})
          </span>
        </div>
        {newCount > 0 && (
          <span className="text-xs text-green-600 font-medium">
            +{newCount} new
          </span>
        )}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Existing and new images */}
        {allImages.map((img, displayIndex) => (
          <div
            key={`${img.isExisting ? 'existing' : 'new'}-${img.index}`}
            className="relative group aspect-square"
          >
            <div className="w-full h-full rounded-lg overflow-hidden border bg-muted">
              <img
                src={proxifyScottImageUrl(img.url)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            {/* New badge */}
            {!img.isExisting && (
              <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                New
              </div>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(img.index, img.isExisting)}
              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Position indicator */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              {displayIndex + 1}
            </div>
          </div>
        ))}

        {/* Add more button (if space allows) */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Add {remainingSlots > 1 ? `(${remainingSlots})` : ''}
            </span>
          </button>
        )}
      </div>

      {/* Add more button (full width, below grid) */}
      {canAddMore && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-3"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          Add images
          {remainingSlots > 1 && (
            <span className="ml-1 text-muted-foreground">({remainingSlots} left)</span>
          )}
        </Button>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="text-xs text-destructive space-y-0.5 mb-3">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => onClose(false)} type="button">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onClose(true)} type="button">
          Done
        </Button>
      </div>
    </div>
  );
};

export const getCellEditor = <TRow,>(type: string) => {
  switch (type) {
    case 'text':
      return TextEditor<TRow>;
    case 'integer':
      return IntegerEditor<TRow>;
    case 'decimal':
      return DecimalEditor<TRow>;
    case 'enum':
      return EnumEditor<TRow>;
    case 'hex':
      return HexEditor<TRow>;
    case 'boolean':
      return BooleanEditor<TRow>;
    case 'url':
      return UrlEditor<TRow>;
    // image and images use popover-based editing in the cell renderer, not inline editing
    case 'image':
    case 'images':
      return undefined;
    default:
      return TextEditor<TRow>;
  }
};

// ===== Validation Helper =====

export const validateCellValue = (
  type: string,
  value: string,
  column: BulkEditColumn<unknown>
): { valid: boolean; error?: string; parsedValue?: unknown } => {
  switch (type) {
    case 'text': {
      const result = parseText(value, column.required);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'integer': {
      const result = parseInteger(value, column.min, column.max);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'decimal': {
      const result = parseDecimal(value, column.min, column.max);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'enum': {
      if (!column.options) return { valid: true, parsedValue: value };
      const trimmed = value.trim();
      const nullable = column.nullable ?? !column.required;
      if (!trimmed && nullable) {
        return { valid: true, parsedValue: '' };
      }
      const result = parseEnum(trimmed, column.options);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'hex': {
      const result = parseHex(value);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'boolean': {
      const result = parseBoolean(value);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'url': {
      const result = parseUrl(value);
      return { valid: result.valid, error: result.error, parsedValue: result.value };
    }
    case 'image': {
      // For image type, value can be a string (URL) or ImageValue object
      // We consider it valid if there's any value (URL or file)
      if (typeof value === 'string') {
        return { valid: true, parsedValue: value };
      }
      if (value && typeof value === 'object') {
        const iv = value as ImageValue;
        const hasValue = !!(iv.existingUrl || iv.file);
        if (column.required && !hasValue) {
          return { valid: false, error: 'Image required', parsedValue: value };
        }
        return { valid: true, parsedValue: value };
      }
      if (column.required) {
        return { valid: false, error: 'Image required', parsedValue: value };
      }
      return { valid: true, parsedValue: value };
    }
    case 'images': {
      // For images type, value should be an ImagesValue object
      if (value && typeof value === 'object') {
        const iv = value as ImagesValue;
        const count = (iv.existingUrls?.length ?? 0) + (iv.files?.length ?? 0);
        if (column.required && count === 0) {
          return { valid: false, error: 'At least one image required', parsedValue: value };
        }
        return { valid: true, parsedValue: value };
      }
      if (column.required) {
        return { valid: false, error: 'At least one image required', parsedValue: value };
      }
      return { valid: true, parsedValue: value };
    }
    default:
      return { valid: true, parsedValue: value };
  }
};

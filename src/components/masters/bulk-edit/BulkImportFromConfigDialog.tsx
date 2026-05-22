import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, type UseMutateAsyncFunction } from '@tanstack/react-query';
import { parseCSV, createCSVContent, downloadCSV } from '@/components/masters/bulk-import/csvUtils';
import { parseEnum, validateCellValue, enumOptionDisplayName } from './cellTypes';
import type { BulkEditColumn } from './types';

export interface BulkImportFromConfigDialogProps<TRow, TCreate, TUpdate> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Display title, e.g. "RMP Brands" */
  title: string;
  /** Filename stem used for the CSV template, e.g. "rmp-brands" → "rmp-brands-template.csv" */
  filenameStem: string;
  columns: BulkEditColumn<TRow>[];
  /** When true, enum option data is still loading — disables file upload until ready */
  columnsLoading?: boolean;
  createEmptyRow: () => TRow;
  toCreatePayload: (row: TRow) => TCreate;
  toUpdatePayload: (row: TRow) => TUpdate;
  queryKey: string[];
  createMutation: UseMutateAsyncFunction<unknown, Error, TCreate, unknown>;
  updateMutation: UseMutateAsyncFunction<unknown, Error, { id: string; updates: TUpdate }, unknown>;
  /** Fetch all existing records for matching (upsert) */
  fetchAll: () => Promise<TRow[]>;
  /** Get the unique ID from a row */
  getRowId: (row: TRow) => string;
  /** Default key field(s) to use for matching (defaults to first required text column) */
  defaultKeyFields?: Array<keyof TRow & string>;
}

type Step = 'upload' | 'configure' | 'review' | 'complete';
type DuplicateStrategy = 'update' | 'skip' | 'create_new';
type RowAction = 'create' | 'update' | 'skip' | 'error';

interface ParsedRow<TRow> {
  rowNumber: number;
  raw: string[];
  /** Parsed row built from createEmptyRow + cell overrides (only present if `valid`). */
  data?: TRow;
  /** Per-column errors. Keyed by header label as it appeared in the CSV. */
  errors: Record<string, string>;
  /** Per-column warnings (e.g., unknown CSV column). */
  warnings: string[];
  valid: boolean;
  /** Classification result after matching against existing rows */
  action?: RowAction;
  /** When action is 'update', the existing row that was matched */
  matchedExisting?: TRow;
  /** Composite key value used for matching */
  keyValue?: string;
}

interface SaveResult {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failures: Array<{
    rowNumber: number;
    error: string;
    raw?: string[]; // Original CSV row data for re-export
  }>;
}

function BulkImportFromConfigDialog<TRow, TCreate, TUpdate>({
  open,
  onOpenChange,
  title,
  filenameStem,
  columns,
  columnsLoading = false,
  createEmptyRow,
  toCreatePayload,
  toUpdatePayload,
  queryKey,
  createMutation,
  updateMutation,
  fetchAll,
  getRowId,
  defaultKeyFields,
}: BulkImportFromConfigDialogProps<TRow, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevProcessFileRef = useRef<((file: File) => Promise<void>) | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow<TRow>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [unknownHeaders, setUnknownHeaders] = useState<string[]>([]);
  const [missingRequiredLabels, setMissingRequiredLabels] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ completed: 0, total: 0, startTime: 0 });
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const abortRef = useRef(false);

  // Upsert-specific state
  const [existingRows, setExistingRows] = useState<TRow[]>([]);
  const [isFetchingExisting, setIsFetchingExisting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<DuplicateStrategy>('update');

  const columnByHeader = useMemo(() => {
    const map = new Map<string, BulkEditColumn<TRow>>();
    for (const col of columns) {
      map.set(col.name.toLowerCase(), col);
      map.set(col.key.toLowerCase(), col);
    }
    return map;
  }, [columns]);

  const keyEligibleColumns = useMemo(() => {
    // Key-eligible: text, integer, decimal, enum (not url, hex, boolean, readonly)
    return columns.filter((c) =>
      ['text', 'integer', 'decimal', 'enum'].includes(c.type)
    );
  }, [columns]);

  // Initialize default key fields when columns change or on first open
  useEffect(() => {
    if (selectedKeys.length === 0 && keyEligibleColumns.length > 0) {
      if (defaultKeyFields && defaultKeyFields.length > 0) {
        // Validate that defaultKeyFields are eligible
        const validDefaults = defaultKeyFields.filter((k) =>
          keyEligibleColumns.some((c) => c.key === k)
        );
        if (validDefaults.length > 0) {
          setSelectedKeys(validDefaults);
        } else {
          // Fallback to first required text column
          const firstRequiredText = keyEligibleColumns.find((c) => c.required && c.type === 'text');
          setSelectedKeys(firstRequiredText ? [firstRequiredText.key] : [keyEligibleColumns[0].key]);
        }
      } else {
        // Default to first required text column, or first eligible column
        const firstRequiredText = keyEligibleColumns.find((c) => c.required && c.type === 'text');
        setSelectedKeys(firstRequiredText ? [firstRequiredText.key] : [keyEligibleColumns[0].key]);
      }
    }
  }, [keyEligibleColumns, defaultKeyFields, selectedKeys.length]);

  const headerNames = useMemo(() => columns.map((c) => c.name), [columns]);
  const sampleRow = useMemo(() => {
    return columns.map((c) => {
      switch (c.type) {
        case 'text':
          return c.required ? `Sample ${c.name}` : '';
        case 'integer':
          return c.required ? '0' : '';
        case 'decimal':
          return c.required ? '0' : '';
        case 'enum':
          return c.options?.[0]?.label ?? '';
        case 'boolean':
          return 'true';
        case 'url':
          return '';
        case 'hex':
          return '#000000';
        default:
          return '';
      }
    });
  }, [columns]);

  const resetAll = useCallback(() => {
    setStep('upload');
    setIsDragOver(false);
    setSelectedFile(null);
    setParsedRows([]);
    setCsvHeaders([]);
    setUnknownHeaders([]);
    setMissingRequiredLabels([]);
    abortRef.current = false;
    setIsImporting(false);
    setImportProgress({ completed: 0, total: 0, startTime: 0 });
    setSaveResult(null);
    setExistingRows([]);
    setIsFetchingExisting(false);
    // Keep selectedKeys and strategy as-is for convenience
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    if (isImporting) return;
    resetAll();
    onOpenChange(false);
  }, [isImporting, onOpenChange, resetAll]);

  const handleCancelImport = useCallback(() => {
    abortRef.current = true;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = parseCSV(text);
        if (parsed.length < 2) {
          toast.error('CSV is empty or only contains a header row.');
          return;
        }

        const headers = parsed[0];
        setCsvHeaders(headers);

        const headerColumns = headers.map((h) => columnByHeader.get(h.trim().toLowerCase()));
        const unknown = headers.filter((h, i) => !headerColumns[i]);
        setUnknownHeaders(unknown);

        const requiredKeys = columns.filter((c) => c.required).map((c) => c.key as string);
        const presentKeys = new Set(
          headerColumns.filter(Boolean).map((c) => (c as BulkEditColumn<TRow>).key as string),
        );
        const missingKeys = requiredKeys.filter((k) => !presentKeys.has(k));
        setMissingRequiredLabels(
          missingKeys.map((k) => columns.find((c) => (c.key as string) === k)?.name ?? k),
        );

        // Pre-build O(1) lookup maps for every enum column so validation is fast
        // even for large files (65k+ rows). Without this, each cell calls options.find()
        // which is O(options.length), making the total O(rows × options) = millions of comparisons.
        type EnumResolver = (value: string) => { valid: boolean; error?: string; parsedValue: unknown };
        const enumResolvers = new Map<string, EnumResolver>();
        for (const col of headerColumns) {
          if (!col || col.type !== 'enum' || !col.options) continue;
          const opts = col.options as Array<{ value: string; label: string }>;
          const byValue = new Map<string, string>();
          const byValueLower = new Map<string, string>();
          const byLabelLower = new Map<string, string>();
          const byDisplayNameLower = new Map<string, string>();
          for (const o of opts) {
            byValue.set(o.value, o.value);
            byValueLower.set(o.value.toLowerCase(), o.value);
            byLabelLower.set(o.label.toLowerCase(), o.value);
            byDisplayNameLower.set(enumOptionDisplayName(o.label).toLowerCase(), o.value);
          }
          const nullable = (col as BulkEditColumn<TRow>).nullable ?? !(col as BulkEditColumn<TRow>).required;
          const shortNames = opts.map((o) => `"${enumOptionDisplayName(o.label)}"`).slice(0, 10).join(', ');
          const more = opts.length > 10 ? ` and ${opts.length - 10} more` : '';
          const examples = opts.slice(0, 3).map((o) => `"${enumOptionDisplayName(o.label)}" (ID: ${o.value})`).join(', ');
          enumResolvers.set(col.key as string, (value: string) => {
            const trimmed = value.trim();
            const tl = trimmed.toLowerCase();
            if (!trimmed && nullable) return { valid: true, parsedValue: '' };
            const resolved = byValue.get(trimmed) ?? byValueLower.get(tl) ?? byLabelLower.get(tl) ?? byDisplayNameLower.get(tl);
            if (resolved !== undefined) return { valid: true, parsedValue: resolved };
            return { valid: false, parsedValue: trimmed, error: `Invalid value "${trimmed}". Allowed names: ${shortNames}${more}. You can also use the full dropdown label or ID. Examples: ${examples}` };
          });
        }

        // Process rows in async chunks to keep the UI thread responsive on large files.
        const CHUNK = 2_000;
        const dataRows = parsed.slice(1);
        const rows: ParsedRow<TRow>[] = [];

        for (let start = 0; start < dataRows.length; start += CHUNK) {
          const chunk = dataRows.slice(start, start + CHUNK);
          for (let ci = 0; ci < chunk.length; ci++) {
            const rawRow = chunk[ci];
            const rowNumber = start + ci + 2;
            const errors: Record<string, string> = {};
            const warnings: string[] = [];
            const draft = createEmptyRow();

            headers.forEach((header, colIdx) => {
              const col = headerColumns[colIdx];
              if (!col) {
                if (rawRow[colIdx]?.trim()) {
                  warnings.push(`Ignoring unknown column "${header}"`);
                }
                return;
              }
              const cellValue = rawRow[colIdx] ?? '';
              // Use pre-built O(1) enum resolver if available, otherwise fall back to validateCellValue
              const resolver = col.type === 'enum' ? enumResolvers.get(col.key as string) : undefined;
              const result = resolver
                ? resolver(cellValue)
                : validateCellValue(col.type, cellValue, col as unknown as BulkEditColumn<unknown>);
              if (!result.valid) {
                errors[col.name] = result.error ?? 'Invalid value';
                return;
              }
              (draft as Record<string, unknown>)[col.key as string] = result.parsedValue ?? '';
            });

            for (const key of missingKeys) {
              const col = columns.find((c) => (c.key as string) === key);
              if (col) errors[col.name] = 'Required column missing in CSV';
            }

            const valid = Object.keys(errors).length === 0;
            rows.push({ rowNumber, raw: rawRow, data: valid ? draft : undefined, errors, warnings, valid });
          }
          // Yield to the main thread between chunks so the browser stays responsive
          await new Promise<void>((r) => setTimeout(r, 0));
        }

        setParsedRows(rows);
        setStep('configure');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to parse CSV');
      }
    },
    [columns, columnByHeader, createEmptyRow],
  );

  // When columns update (e.g. enum options finish loading after the file was already uploaded),
  // re-run processFile so rows are validated against the now-populated options.
  useEffect(() => {
    if (prevProcessFileRef.current !== processFile) {
      prevProcessFileRef.current = processFile;
      if (selectedFile && (step === 'configure' || step === 'review')) {
        void processFile(selectedFile);
      }
    } else {
      prevProcessFileRef.current = processFile;
    }
  }, [processFile, selectedFile, step]);

  const downloadTemplate = useCallback(() => {
    const content = createCSVContent(headerNames, [sampleRow]);
    downloadCSV(content, `${filenameStem}-template.csv`);
  }, [headerNames, sampleRow, filenameStem]);

  // Normalize a row's key value(s) for matching
  const normalizeKeyValue = useCallback((row: TRow | undefined, keys: string[]): string => {
    if (!row) return '';
    const parts = keys.map((key) => {
      const col = columns.find((c) => c.key === key);
      const rawValue = (row as Record<string, unknown>)[key];
      if (rawValue == null || rawValue === '') return '';

      if (col?.type === 'integer' || col?.type === 'decimal') {
        // Normalize numeric to string without decimals for integers
        const num = Number(rawValue);
        if (isNaN(num)) return String(rawValue).trim().toLowerCase();
        return col.type === 'integer' ? String(Math.floor(num)) : String(num);
      }

      if (col?.type === 'enum') {
        const strVal = String(rawValue);
        const opts = col.options ?? [];
        const parsed = parseEnum(strVal, opts);
        if (parsed.valid) {
          const resolved = String(parsed.value);
          const opt = opts.find((o) => o.value === resolved);
          if (opt) {
            // Match on human-readable name, not raw id, so duplicate options (same name, different ids)
            // still align with DB rows that reference another id for the same label.
            return enumOptionDisplayName(opt.label).trim().toLowerCase();
          }
          return resolved.toLowerCase();
        }
        return strVal.trim().toLowerCase();
      }

      // Text and everything else: trim + lowercase (strip BOM often present on Excel CSV first cell)
      return String(rawValue).trim().replace(/^\uFEFF/, '').toLowerCase();
    });
    return parts.join('|');
  }, [columns]);

  // Build lookup index from existing rows
  const existingIndex = useMemo(() => {
    const index = new Map<string, TRow>();
    if (selectedKeys.length === 0) return index;

    const emptyKeyRows: TRow[] = [];
    const overwrittenKeys: Array<{ key: string; prev: TRow; next: TRow }> = [];

    for (const row of existingRows) {
      const key = normalizeKeyValue(row, selectedKeys);
      if (!key) {
        emptyKeyRows.push(row);
        continue;
      }
      if (index.has(key)) {
        overwrittenKeys.push({ key, prev: index.get(key)!, next: row });
      }
      index.set(key, row);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[BulkImport] existingIndex built: ${index.size} entries from ${existingRows.length} fetched rows`,
        { selectedKeys },
      );
      if (emptyKeyRows.length > 0) {
        console.warn(
          `[BulkImport] ${emptyKeyRows.length} DB rows had EMPTY key — skipped from index:`,
          emptyKeyRows.map((r) => ({ id: (r as Record<string, unknown>).id, name: (r as Record<string, unknown>).name })),
        );
      }
      if (overwrittenKeys.length > 0) {
        const dupKeys = overwrittenKeys.map((o) => o.key).join(', ');
        console.warn(
          `[BulkImport] ${overwrittenKeys.length} DB rows share a key (duplicate names) — DUPLICATE KEYS: ${dupKeys}`,
        );
      }
    }
    return index;
  }, [existingRows, selectedKeys, normalizeKeyValue]);

  // Fetch existing rows once when entering review step
  const fetchExistingRows = useCallback(async () => {
    setIsFetchingExisting(true);
    try {
      const rows = await fetchAll();
      if (import.meta.env.DEV) {
        console.log(`[BulkImport] fetchAll returned ${rows.length} existing rows`);
      }
      setExistingRows(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to fetch existing records');
    } finally {
      setIsFetchingExisting(false);
    }
  }, [fetchAll]);

  const runMatch = useCallback(async () => {
    // For create_new strategy we never need to compare against existing rows
    if (strategy !== 'create_new') {
      await fetchExistingRows();
    } else {
      setExistingRows([]);
    }
    setStep('review');
  }, [fetchExistingRows, strategy]);

  // Re-classify parsed rows whenever keys, strategy, or existing data changes
  useEffect(() => {
    if (parsedRows.length === 0) return;

    const misses: Array<{ rowNumber: number; keyValue: string; raw: string[] }> = [];

    // Track keys seen within this CSV to detect intra-CSV duplicates
    const seenCsvKeys = new Map<string, number>(); // key → first rowNumber

    const classified = parsedRows.map((pr): ParsedRow<TRow> => {
      if (!pr.valid || !pr.data) {
        return { ...pr, action: 'error', keyValue: undefined };
      }

      const keyValue = normalizeKeyValue(pr.data, selectedKeys);

      // Detect duplicate keys within the CSV itself
      if (keyValue && seenCsvKeys.has(keyValue)) {
        const firstRow = seenCsvKeys.get(keyValue)!;
        return {
          ...pr,
          action: 'error',
          keyValue,
          errors: {
            ...(pr.errors ?? {}),
            _duplicate: `Duplicate of row ${firstRow} — same key "${keyValue}" already appears in this file`,
          },
        };
      }
      if (keyValue) seenCsvKeys.set(keyValue, pr.rowNumber);

      const matched = existingIndex.get(keyValue);

      if (!matched) {
        misses.push({ rowNumber: pr.rowNumber, keyValue, raw: pr.raw });
        return { ...pr, action: 'create', keyValue };
      }

      // Match found - apply strategy
      switch (strategy) {
        case 'update':
          return { ...pr, action: 'update', keyValue, matchedExisting: matched };
        case 'skip':
          return { ...pr, action: 'skip', keyValue, matchedExisting: matched };
        case 'create_new':
        default:
          return { ...pr, action: 'create', keyValue };
      }
    });

    if (import.meta.env.DEV && misses.length > 0 && existingIndex.size > 0) {
      console.group(`[BulkImport] ${misses.length} rows have no match in existing ${existingIndex.size} records`);
      console.log('Key fields used:', selectedKeys);
      console.log('Miss details (keyValue | rawRow):');
      misses.forEach((m) => {
        // Also check if the key appears anywhere in the index with a loose search
        const nearby = [...existingIndex.keys()].filter(
          (k) => k.includes(m.keyValue) || m.keyValue.includes(k),
        );
        console.log(
          `  Row ${m.rowNumber}: keyValue="${m.keyValue}"`,
          nearby.length ? `  ← near-matches in index: ${nearby.slice(0, 3).join(', ')}` : '  ← no near-matches found',
          '\n  raw:', m.raw,
        );
      });
      console.groupEnd();
    }

    setParsedRows(classified);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys, strategy, existingIndex]); // Don't include parsedRows to avoid loop

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        toast.error('Please choose a CSV file.');
        return;
      }
      setSelectedFile(file);
      void processFile(file);
    },
    [processFile],
  );

  const classifiedRows = useMemo(() => {
    return {
      create: parsedRows.filter((r) => r.valid && r.action === 'create'),
      update: parsedRows.filter((r) => r.valid && r.action === 'update'),
      skip: parsedRows.filter((r) => r.valid && r.action === 'skip'),
      duplicate: parsedRows.filter((r) => r.valid && r.action === 'error'),
      error: parsedRows.filter((r) => !r.valid),
    };
  }, [parsedRows]);

  const actionableRows = useMemo(
    () => [...classifiedRows.create, ...classifiedRows.update],
    [classifiedRows.create, classifiedRows.update]
  );

  const confirmImport = useCallback(async () => {
    if (actionableRows.length === 0) return;

    abortRef.current = false;
    setIsImporting(true);
    setImportProgress({ completed: 0, total: actionableRows.length, startTime: Date.now() });

    // Re-fetch existing rows right before executing so we never act on stale state
    // (e.g. the user deleted records while the dialog was already open on the review step).
    let freshExisting: TRow[] = existingRows;
    try {
      freshExisting = await fetchAll();
      setExistingRows(freshExisting);
    } catch {
      // Non-fatal: fall back to cached rows; worst case some updates fail and the user retries
    }

    // Build a fresh index from the live data
    const freshIndex = new Map<string, TRow>();
    for (const row of freshExisting) {
      const key = normalizeKeyValue(row, selectedKeys);
      freshIndex.set(key, row);
    }

    // Re-classify each row against the fresh index so actions are always accurate
    const freshRows = actionableRows.map((pr) => {
      if (!pr.valid || !pr.data) return pr;
      const keyValue = normalizeKeyValue(pr.data as TRow, selectedKeys);
      const matched = freshIndex.get(keyValue);
      if (!matched) return { ...pr, action: 'create' as const, matchedExisting: undefined };
      if (strategy === 'skip') return { ...pr, action: 'skip' as const, matchedExisting: matched };
      if (strategy === 'create_new') return { ...pr, action: 'create' as const, matchedExisting: undefined };
      return { ...pr, action: 'update' as const, matchedExisting: matched };
    }).filter((r) => r.action !== 'skip');

    const failures: SaveResult['failures'] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Scale concurrency with dataset size to keep large imports reasonably fast
    // without hammering the API on small datasets.
    const CONCURRENCY = freshRows.length > 10_000 ? 80 : freshRows.length > 1_000 ? 40 : 20;

    for (let i = 0; i < freshRows.length; i += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = freshRows.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (row) => {
          try {
            if (row.action === 'create') {
              await createMutation(toCreatePayload(row.data as TRow));
              createdCount++;
            } else if (row.action === 'update' && row.matchedExisting) {
              const existingId = getRowId(row.matchedExisting);
              // Merge: overlay parsed data onto existing row so unmentioned columns aren't lost
              const merged = { ...row.matchedExisting, ...(row.data as TRow) };
              await updateMutation({ id: existingId, updates: toUpdatePayload(merged) });
              updatedCount++;
            }
          } catch (e) {
            failures.push({
              rowNumber: row.rowNumber,
              error: e instanceof Error ? e.message : 'Unknown error',
              raw: row.raw,
            });
          }
        }),
      );
      setImportProgress((prev) => ({ ...prev, completed: Math.min(i + CONCURRENCY, freshRows.length) }));
    }

    if (abortRef.current) {
      toast.warning(`Import cancelled after ${createdCount + updatedCount} rows.`);
      abortRef.current = false;
      setIsImporting(false);
      setImportProgress({ completed: 0, total: 0, startTime: 0 });
      return;
    }

    // Count skips: original skips from pre-flight + any rows reclassified to skip at run time
    skippedCount = classifiedRows.skip.length + (actionableRows.length - freshRows.length);

    await queryClient.invalidateQueries({ queryKey });

    setSaveResult({ createdCount, updatedCount, skippedCount, failures });
    setIsImporting(false);
    setStep('complete');

    if (failures.length === 0) {
      toast.success(
        `Import complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`,
      );
    } else {
      toast.error(`${failures.length} of ${actionableRows.length} rows failed.`);
    }
  }, [
    actionableRows,
    classifiedRows.skip.length,
    createMutation,
    toCreatePayload,
    toUpdatePayload,
    updateMutation,
    getRowId,
    queryClient,
    queryKey,
    fetchAll,
    existingRows,
    setExistingRows,
    normalizeKeyValue,
    selectedKeys,
    strategy,
  ]);

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Bulk Import · {title}</DialogTitle>
          <DialogDescription className="sr-only">
            Bulk import for {title}. Review CSV rows, then confirm to create or update records.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          {step === 'upload' && (
            <UploadStep
              columns={columns}
              columnsLoading={columnsLoading}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              fileInputRef={fileInputRef}
              onFile={handleFile}
              onDownloadTemplate={downloadTemplate}
              filenameStem={filenameStem}
            />
          )}

          {step === 'configure' && (
            <ConfigureStep
              file={selectedFile}
              parsedRows={parsedRows}
              keyEligibleColumns={keyEligibleColumns}
              selectedKeys={selectedKeys}
              setSelectedKeys={setSelectedKeys}
              strategy={strategy}
              setStrategy={setStrategy}
              isFetchingExisting={isFetchingExisting}
              onStartOver={resetAll}
              onRunMatch={runMatch}
            />
          )}

          {step === 'review' && (
            <ReviewStep
              file={selectedFile}
              csvHeaders={csvHeaders}
              unknownHeaders={unknownHeaders}
              missingRequiredLabels={missingRequiredLabels}
              parsedRows={parsedRows}
              classifiedRows={classifiedRows}
              isImporting={isImporting}
              isFetchingExisting={isFetchingExisting}
              importProgress={importProgress}
              onStartOver={resetAll}
              onConfirmImport={confirmImport}
              onCancelImport={handleCancelImport}
              keyEligibleColumns={keyEligibleColumns}
              selectedKeys={selectedKeys}
              setSelectedKeys={setSelectedKeys}
              strategy={strategy}
              setStrategy={setStrategy}
              onRefreshExisting={fetchExistingRows}
              filenameStem={filenameStem}
            />
          )}

          {step === 'complete' && saveResult && (
            <CompleteStep
              title={title}
              saveResult={saveResult}
              onClose={handleClose}
              onImportMore={resetAll}
              csvHeaders={csvHeaders}
              filenameStem={filenameStem}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UploadStepProps<TRow> {
  columns: BulkEditColumn<TRow>[];
  columnsLoading?: boolean;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onDownloadTemplate: () => void;
  filenameStem: string;
}

function UploadStep<TRow>({
  columns,
  columnsLoading = false,
  isDragOver,
  setIsDragOver,
  fileInputRef,
  onFile,
  onDownloadTemplate,
  filenameStem,
}: UploadStepProps<TRow>) {
  const requiredCols = columns.filter((c) => c.required);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Step 1 — Download the template</CardTitle>
          <CardDescription>
            Use this CSV as a starting point. Headers and column types match the bulk-edit grid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" onClick={onDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV template
          </Button>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex flex-wrap gap-1">
              <span className="font-medium text-foreground">Required:</span>
              {requiredCols.length === 0 ? (
                <span>None</span>
              ) : (
                requiredCols.map((c) => (
                  <Badge key={c.key as string} variant="outline" className="text-xs">
                    {c.name}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valid Options Reference */}
      {columns.some((c) => c.type === 'enum' && c.options && c.options.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Valid values for dropdown columns</CardTitle>
                <CardDescription>
                  Use the name or ID for these columns — both work (case-insensitive).
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const enumColumns = columns.filter((c) => c.type === 'enum' && c.options && c.options.length > 0);
                  const allRows: string[][] = [];
                  // Find max options count
                  const maxOptions = Math.max(...enumColumns.map((c) => c.options?.length ?? 0));
                  // Build rows
                  for (let i = 0; i < maxOptions; i++) {
                    const row: string[] = [];
                    for (const col of enumColumns) {
                      const opt = col.options?.[i];
                      row.push(opt ? `${opt.label} (${opt.value})` : '');
                    }
                    allRows.push(row);
                  }
                  const headers = enumColumns.map((c) => c.name);
                  const content = createCSVContent(headers, allRows);
                  downloadCSV(content, `${filenameStem}-reference-values.csv`);
                }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export values
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs">
              {columns
                .filter((c) => c.type === 'enum' && c.options && c.options.length > 0)
                .map((c) => (
                  <div key={c.key as string}>
                    <div className="font-medium text-foreground mb-1">{c.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {c.options?.slice(0, 8).map((o) => (
                        <Badge key={o.value} variant="outline" className="font-normal text-[10px]" title={`ID: ${o.value}`}>
                          {o.label}
                        </Badge>
                      ))}
                      {(c.options?.length ?? 0) > 8 && (
                        <span className="text-muted-foreground">+{(c.options?.length ?? 0) - 8} more</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Step 2 — Upload the filled CSV</CardTitle>
        </CardHeader>
        <CardContent>
          {columnsLoading ? (
            <div className="border-2 border-dashed rounded-md p-10 text-center border-muted-foreground/20 bg-muted/20">
              <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading valid options…</p>
              <p className="text-xs text-muted-foreground mt-1">Please wait before uploading your CSV</p>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-md p-10 text-center transition-colors cursor-pointer ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-muted-foreground/60'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFile(file);
              }}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop your CSV here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ConfigureStepProps<TRow> {
  file: File | null;
  parsedRows: ParsedRow<TRow>[];
  keyEligibleColumns: BulkEditColumn<TRow>[];
  selectedKeys: string[];
  setSelectedKeys: (keys: string[]) => void;
  strategy: DuplicateStrategy;
  setStrategy: (s: DuplicateStrategy) => void;
  isFetchingExisting: boolean;
  onStartOver: () => void;
  onRunMatch: () => void;
}

function ConfigureStep<TRow>({
  file,
  parsedRows,
  keyEligibleColumns,
  selectedKeys,
  setSelectedKeys,
  strategy,
  setStrategy,
  isFetchingExisting,
  onStartOver,
  onRunMatch,
}: ConfigureStepProps<TRow>) {
  return (
    <div className="space-y-4">
      {/* File summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {file?.name ?? 'Selected CSV'}
          </CardTitle>
          <CardDescription>
            {parsedRows.length} data row{parsedRows.length === 1 ? '' : 's'} ready to be matched
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Match settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configure matching</CardTitle>
          <CardDescription>
            Choose the key field(s) used to detect duplicates, then decide what happens when a match is found.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Field Multi-Select */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Key field(s) for matching</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 justify-between font-normal"
                  disabled={isFetchingExisting}
                >
                  <span className="truncate max-w-[200px]">
                    {selectedKeys.length === 0
                      ? 'Select key fields…'
                      : keyEligibleColumns
                          .filter((c) => selectedKeys.includes(c.key))
                          .map((c) => c.name)
                          .join(' + ')}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-48 overflow-auto">
                  {keyEligibleColumns.map((col) => (
                    <div key={col.key} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded">
                      <Checkbox
                        id={`cfg-key-${String(col.key)}`}
                        checked={selectedKeys.includes(col.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedKeys([...selectedKeys, col.key]);
                          } else {
                            setSelectedKeys(selectedKeys.filter((k) => k !== col.key));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`cfg-key-${String(col.key)}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {col.name}
                        {col.required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setSelectedKeys([])}
                    disabled={selectedKeys.length === 0}
                  >
                    Clear selection
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Rows are matched on the combined value of selected fields. Use multiple fields for composite keys.
            </p>
          </div>

          {/* Strategy Radio */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">When a duplicate is found</Label>
            <RadioGroup
              value={strategy}
              onValueChange={(v) => setStrategy(v as DuplicateStrategy)}
              className="flex flex-col gap-2"
              disabled={isFetchingExisting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="cfg-strategy-update" />
                <Label htmlFor="cfg-strategy-update" className="text-sm font-normal cursor-pointer">
                  Update existing record
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="cfg-strategy-skip" />
                <Label htmlFor="cfg-strategy-skip" className="text-sm font-normal cursor-pointer">
                  Skip (do nothing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create_new" id="cfg-strategy-create" />
                <Label htmlFor="cfg-strategy-create" className="text-sm font-normal cursor-pointer">
                  Always create new record
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onStartOver} disabled={isFetchingExisting}>
          Start over
        </Button>
        <Button
          onClick={onRunMatch}
          disabled={isFetchingExisting || selectedKeys.length === 0}
        >
          {isFetchingExisting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading records…
            </>
          ) : (
            'Match & Preview'
          )}
        </Button>
      </div>
    </div>
  );
}

interface ReviewStepProps<TRow> {
  file: File | null;
  csvHeaders: string[];
  unknownHeaders: string[];
  missingRequiredLabels: string[];
  parsedRows: ParsedRow<TRow>[];
  classifiedRows: {
    create: ParsedRow<TRow>[];
    update: ParsedRow<TRow>[];
    skip: ParsedRow<TRow>[];
    duplicate: ParsedRow<TRow>[];
    error: ParsedRow<TRow>[];
  };
  isImporting: boolean;
  isFetchingExisting: boolean;
  importProgress: { completed: number; total: number; startTime: number };
  onStartOver: () => void;
  onConfirmImport: () => void;
  onCancelImport: () => void;
  keyEligibleColumns: BulkEditColumn<TRow>[];
  selectedKeys: string[];
  setSelectedKeys: (keys: string[]) => void;
  strategy: DuplicateStrategy;
  setStrategy: (s: DuplicateStrategy) => void;
  onRefreshExisting: () => void;
  filenameStem: string;
}

function ReviewStep<TRow>({
  file,
  csvHeaders,
  unknownHeaders,
  missingRequiredLabels,
  parsedRows,
  classifiedRows,
  isImporting,
  isFetchingExisting,
  importProgress,
  onStartOver,
  onConfirmImport,
  onCancelImport,
  keyEligibleColumns,
  selectedKeys,
  setSelectedKeys,
  strategy,
  setStrategy,
  onRefreshExisting,
  filenameStem,
}: ReviewStepProps<TRow>) {
  const previewLimit = 6;
  const actionableCount = classifiedRows.create.length + classifiedRows.update.length;

  const exportValidationErrorsCsv = useCallback(() => {
    const errorRows = classifiedRows.error;
    if (errorRows.length === 0) return;
    const hasWarnings = errorRows.some((r) => (r.warnings?.length ?? 0) > 0);
    const headers = ['Row', ...csvHeaders, 'Errors', ...(hasWarnings ? (['Warnings'] as const) : [])];
    const data = errorRows.map((r) => {
      const padded = csvHeaders.map((_, i) => r.raw[i] ?? '');
      const errStr = Object.entries(r.errors)
        .map(([k, v]) => `${k.startsWith('_') ? k.replace(/^_/, '') : k}: ${v}`)
        .join(' | ');
      const row: string[] = [String(r.rowNumber), ...padded, errStr];
      if (hasWarnings) {
        row.push(r.warnings?.length ? r.warnings.join(' | ') : '');
      }
      return row;
    });
    const content = createCSVContent(headers, data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadCSV(content, `${filenameStem}-import-errors-${timestamp}.csv`);
    toast.success(`Exported ${errorRows.length} error row${errorRows.length === 1 ? '' : 's'} to CSV`);
  }, [classifiedRows.error, csvHeaders, filenameStem]);

  return (
    <div className="space-y-4">
      {parsedRows.length > 10_000 && !isImporting && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400 space-y-1">
          <p className="font-medium flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Large dataset — {parsedRows.length.toLocaleString()} rows
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
            Each row requires an individual API call. At this volume, import may take
            {' '}<strong>10–20 minutes</strong>. Keep this tab open and do not navigate away.
            {' '}Consider splitting the file into smaller batches (&lt;10k rows) for faster results.
          </p>
        </div>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {file?.name ?? 'Selected CSV'}
          </CardTitle>
          <CardDescription>
            {csvHeaders.length} column{csvHeaders.length === 1 ? '' : 's'} · {parsedRows.length} row{parsedRows.length === 1 ? '' : 's'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {classifiedRows.create.length > 0 && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {classifiedRows.create.length} create
              </Badge>
            )}
            {classifiedRows.update.length > 0 && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                <RefreshCw className="h-3 w-3 mr-1" />
                {classifiedRows.update.length} update
              </Badge>
            )}
            {classifiedRows.skip.length > 0 && (
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-muted-foreground/20">
                {classifiedRows.skip.length} skip (duplicate)
              </Badge>
            )}
            {classifiedRows.duplicate.length > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                {classifiedRows.duplicate.length} duplicate{classifiedRows.duplicate.length === 1 ? '' : 's'} skipped
              </Badge>
            )}
            {classifiedRows.error.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {classifiedRows.error.length} need fixing
              </Badge>
            )}
            {unknownHeaders.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Ignored: {unknownHeaders.join(', ')}
              </Badge>
            )}
            {missingRequiredLabels.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                Missing required column{missingRequiredLabels.length === 1 ? '' : 's'}:{' '}
                {missingRequiredLabels.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Match Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Match settings</CardTitle>
            {isFetchingExisting && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading existing records…
              </span>
            )}
          </div>
          <CardDescription>
            Choose how to detect duplicates and what to do when a match is found.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Field Multi-Select */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Key field(s) for matching</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 justify-between font-normal"
                  disabled={isImporting || isFetchingExisting}
                >
                  <span className="truncate max-w-[200px]">
                    {selectedKeys.length === 0
                      ? 'Select key fields…'
                      : keyEligibleColumns
                          .filter((c) => selectedKeys.includes(c.key))
                          .map((c) => c.name)
                          .join(' + ')}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-48 overflow-auto">
                  {keyEligibleColumns.map((col) => (
                    <div key={col.key} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded">
                      <Checkbox
                        id={`key-${String(col.key)}`}
                        checked={selectedKeys.includes(col.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedKeys([...selectedKeys, col.key]);
                          } else {
                            setSelectedKeys(selectedKeys.filter((k) => k !== col.key));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`key-${String(col.key)}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {col.name}
                        {col.required && <span className="text-destructive ml-0.5">*</span>}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setSelectedKeys([])}
                    disabled={selectedKeys.length === 0}
                  >
                    Clear selection
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Rows are matched on the combined value of selected fields. Use multiple fields for composite keys.
            </p>
          </div>

          {/* Strategy Radio */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">When a duplicate is found</Label>
            <RadioGroup
              value={strategy}
              onValueChange={(v) => setStrategy(v as DuplicateStrategy)}
              className="flex flex-col gap-2"
              disabled={isImporting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="strategy-update" />
                <Label htmlFor="strategy-update" className="text-sm font-normal cursor-pointer">
                  Update existing record
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="strategy-skip" />
                <Label htmlFor="strategy-skip" className="text-sm font-normal cursor-pointer">
                  Skip (do nothing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create_new" id="strategy-create" />
                <Label htmlFor="strategy-create" className="text-sm font-normal cursor-pointer">
                  Always create new record
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshExisting}
            disabled={isImporting || isFetchingExisting}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isFetchingExisting ? 'animate-spin' : ''}`} />
            Refresh existing records
          </Button>
        </CardContent>
      </Card>

      {classifiedRows.error.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-sm text-destructive">Errors</CardTitle>
                <CardDescription>
                  Fix these in your CSV and re-upload, or import only the {actionableCount} actionable rows. Use the
                  Export errors CSV button to download every failed row (the list below shows at most 50).
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={exportValidationErrorsCsv}
                disabled={isImporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export errors CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-3">
                {classifiedRows.error.slice(0, 50).map((r) => (
                  <div key={r.rowNumber} className="text-xs border rounded p-2 bg-muted/30">
                    <div className="font-medium">Row {r.rowNumber}</div>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {Object.entries(r.errors).map(([col, err]) => (
                        <li key={col}>
                          <span className="text-foreground">
                            {col.startsWith('_') ? col.replace(/^_/, '').replace(/-/g, ' ') : col}:
                          </span>{' '}
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {classifiedRows.error.length > 50 && (
                  <p className="text-xs text-muted-foreground">…and {classifiedRows.error.length - 50} more.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {(classifiedRows.create.length > 0 || classifiedRows.update.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Preview (first {Math.min(previewLimit, actionableCount)} of {actionableCount} to import)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-1.5 font-medium w-16">Action</th>
                    {csvHeaders.map((h) => (
                      <th key={h} className="text-left p-1.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...classifiedRows.create, ...classifiedRows.update].slice(0, previewLimit).map((r) => (
                    <tr key={r.rowNumber} className="border-b">
                      <td className="p-1.5">
                        {r.action === 'create' ? (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Create</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Update</Badge>
                        )}
                      </td>
                      {csvHeaders.map((_, i) => (
                        <td key={i} className="p-1.5 text-muted-foreground truncate max-w-[14ch]">
                          {r.raw[i] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {isImporting && (
        <div className="space-y-2">
          <Progress value={(importProgress.completed / Math.max(1, importProgress.total)) * 100} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Importing {importProgress.completed.toLocaleString()} / {importProgress.total.toLocaleString()}</span>
            {importProgress.startTime > 0 && importProgress.completed > 0 && (() => {
              const elapsed = (Date.now() - importProgress.startTime) / 1000;
              const rate = importProgress.completed / elapsed;
              const remaining = (importProgress.total - importProgress.completed) / Math.max(rate, 0.1);
              if (remaining < 5) return null;
              const mins = Math.floor(remaining / 60);
              const secs = Math.round(remaining % 60);
              return <span>~{mins > 0 ? `${mins}m ` : ''}{secs}s remaining</span>;
            })()}
          </div>
          <p className="text-xs text-amber-600/80 text-center">Do not close this tab — import is in progress.</p>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onStartOver} disabled={isImporting}>
          Start over
        </Button>
        {isImporting && (
          <Button variant="destructive" size="sm" onClick={onCancelImport}>
            Cancel import
          </Button>
        )}
        <Button
          onClick={onConfirmImport}
          disabled={isImporting || actionableCount === 0}
        >
          {isImporting
            ? `Importing ${importProgress.completed.toLocaleString()}/${importProgress.total.toLocaleString()}…`
            : `Import ${actionableCount} row${actionableCount === 1 ? '' : 's'}`}
        </Button>
      </div>
    </div>
  );
}

interface CompleteStepProps {
  title: string;
  saveResult: SaveResult;
  onClose: () => void;
  onImportMore: () => void;
  csvHeaders: string[];
  filenameStem: string;
}

const CompleteStep: React.FC<CompleteStepProps> = ({
  title,
  saveResult,
  onClose,
  onImportMore,
  csvHeaders,
  filenameStem,
}) => {
  const { createdCount, updatedCount, skippedCount, failures } = saveResult;
  const hasFailures = failures.length > 0;

  // Export failures CSV with comments column
  const exportFailuresCSV = useCallback(() => {
    if (failures.length === 0) return;

    const headers = [...csvHeaders, 'comments'];
    const data = failures
      .filter((f) => f.raw && f.raw.length > 0)
      .map((f) => [...(f.raw as string[]), f.error]);

    if (data.length === 0) {
      toast.error('No failure data to export');
      return;
    }

    const content = createCSVContent(headers, data);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadCSV(content, `${filenameStem}-failures-${timestamp}.csv`);
    toast.success(`Exported ${data.length} failed rows with comments`);
  }, [failures, csvHeaders, filenameStem]);

  return (
    <div className="space-y-4 text-center py-4">
      {hasFailures ? (
        <>
          <AlertCircle className="h-12 w-12 mx-auto text-amber-600" />
          <h2 className="text-lg font-semibold">Import completed with errors</h2>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
          <h2 className="text-lg font-semibold">Import complete</h2>
        </>
      )}

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {createdCount > 0 && (
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            {createdCount} created
          </Badge>
        )}
        {updatedCount > 0 && (
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {updatedCount} updated
          </Badge>
        )}
        {skippedCount > 0 && (
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-muted-foreground/20">
            {skippedCount} skipped
          </Badge>
        )}
        {failures.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {failures.length} failed
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {title} import finished.
      </p>

      {failures.length > 0 && (
        <ScrollArea className="h-40 text-left mx-auto max-w-md">
          <div className="space-y-1 px-2">
            {failures.map((f) => (
              <div key={f.rowNumber} className="text-xs">
                <span className="font-medium">Row {f.rowNumber}:</span>{' '}
                <span className="text-muted-foreground">{f.error}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex items-center justify-center gap-2 pt-2">
        {failures.length > 0 && (
          <Button variant="outline" onClick={exportFailuresCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export failures
          </Button>
        )}
        <Button variant="outline" onClick={onImportMore}>
          <Upload className="h-4 w-4 mr-2" />
          Import another file
        </Button>
        <Button onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );
};

export default BulkImportFromConfigDialog;

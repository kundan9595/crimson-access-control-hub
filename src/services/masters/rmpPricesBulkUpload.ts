import {
  callScottDashboard,
  extractScottEntity,
  fileToScottPayload,
} from '@/services/scott/callScottDashboard';

export type RmpPricesBulkUploadPhase = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export interface RmpPricesBulkUploadFailure {
  rowNumber?: number;
  error: string;
}

export interface RmpPricesBulkUploadStatus {
  phase: RmpPricesBulkUploadPhase;
  message?: string;
  total?: number;
  processed?: number;
  created?: number;
  updated?: number;
  failed?: number;
  skipped?: number;
  progress?: number;
  failures: RmpPricesBulkUploadFailure[];
}

export interface RmpPricesBulkUploadSaveResult {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failures: Array<{
    rowNumber: number;
    error: string;
  }>;
}

export interface PollRmpPricesBulkUploadOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onProgress?: (status: RmpPricesBulkUploadStatus) => void;
  /** Ignore idle responses until this many polls (upload may need a moment to register). */
  minPollsBeforeIdleTerminal?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_POLL_TIMEOUT_MS = 30 * 60 * 1_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Import cancelled'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new Error('Import cancelled'));
      },
      { once: true },
    );
  });
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value == null || value === '') continue;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return undefined;
}

function normalizePhase(raw: unknown): RmpPricesBulkUploadPhase {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return 'processing';
  if (['completed', 'complete', 'success', 'done', 'finished'].includes(value)) return 'completed';
  if (['failed', 'failure', 'error'].includes(value)) return 'failed';
  if (['idle', 'none', 'not_found', 'not found'].includes(value)) return 'idle';
  if (['pending', 'queued', 'waiting', 'starting'].includes(value)) return 'pending';
  return 'processing';
}

function parseFailureRows(raw: unknown): RmpPricesBulkUploadFailure[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { error: item };
      }
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const rowNumber = readNumber(row.row, row.row_number, row.line, row.line_number);
      const error =
        (typeof row.message === 'string' && row.message) ||
        (typeof row.error === 'string' && row.error) ||
        (typeof row.reason === 'string' && row.reason) ||
        'Import failed';
      return {
        rowNumber: rowNumber != null ? Math.trunc(rowNumber) : undefined,
        error,
      };
    })
    .filter((item): item is RmpPricesBulkUploadFailure => item != null);
}

function unwrapStatusPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }

  const root = body as Record<string, unknown>;
  const entity = extractScottEntity(body);
  if (entity) return entity;

  const data = root.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return root;
}

export function parseRmpPricesBulkUploadStatus(body: unknown): RmpPricesBulkUploadStatus {
  const payload = unwrapStatusPayload(body);
  const successFlag = payload.success;
  const explicitPhase = payload.status ?? payload.state ?? payload.job_status ?? payload.upload_status;

  let phase = normalizePhase(explicitPhase);
  if (phase === 'processing' && (successFlag === true || successFlag === 'true')) {
    phase = 'completed';
  }
  if (phase === 'processing' && (successFlag === false || successFlag === 'false')) {
    phase = 'failed';
  }

  const total = readNumber(payload.total, payload.total_rows, payload.count, payload.row_count);
  const processed = readNumber(
    payload.processed,
    payload.processed_rows,
    payload.completed,
    payload.completed_rows,
    payload.imported,
  );
  const progress = readNumber(payload.progress, payload.percentage, payload.percent);
  const derivedProgress =
    progress ??
    (total != null && processed != null && total > 0
      ? Math.min(100, Math.round((processed / total) * 100))
      : undefined);

  const message =
    (typeof payload.message === 'string' && payload.message) ||
    (typeof payload.error === 'string' && payload.error) ||
    undefined;

  const failures = parseFailureRows(
    payload.failures ?? payload.errors ?? payload.error_rows ?? payload.failed_rows,
  );

  return {
    phase,
    message,
    total,
    processed,
    created: readNumber(payload.created, payload.created_count, payload.inserted, payload.inserted_count),
    updated: readNumber(payload.updated, payload.updated_count),
    failed: readNumber(payload.failed, payload.failed_count, payload.errors_count, payload.failure_count),
    skipped: readNumber(payload.skipped, payload.skipped_count),
    progress: derivedProgress,
    failures,
  };
}

export function toBulkUploadSaveResult(status: RmpPricesBulkUploadStatus): RmpPricesBulkUploadSaveResult {
  const failures = status.failures.map((failure, index) => ({
    rowNumber: failure.rowNumber ?? index + 1,
    error: failure.error,
  }));

  const failedCount = status.failed ?? failures.length;
  if (failedCount > failures.length) {
    const missing = failedCount - failures.length;
    for (let i = 0; i < missing; i += 1) {
      failures.push({
        rowNumber: failures.length + 1,
        error: status.message ?? 'Import failed',
      });
    }
  }

  return {
    createdCount: status.created ?? 0,
    updatedCount: status.updated ?? 0,
    skippedCount: status.skipped ?? 0,
    failures,
  };
}

export async function uploadRmpPricesBulk(file: File): Promise<RmpPricesBulkUploadStatus> {
  const { body } = await callScottDashboard<unknown>({
    resource: 'rmp_prices',
    method: 'POST',
    pathSuffix: 'bulk_upload',
    body: {
      file: await fileToScottPayload(file),
    },
  });
  return parseRmpPricesBulkUploadStatus(body);
}

export async function fetchRmpPricesBulkUploadStatus(): Promise<RmpPricesBulkUploadStatus> {
  const { body } = await callScottDashboard<unknown>({
    resource: 'rmp_prices',
    method: 'GET',
    pathSuffix: 'bulk_upload_status',
  });
  return parseRmpPricesBulkUploadStatus(body);
}

function isTerminalPhase(phase: RmpPricesBulkUploadPhase): boolean {
  return phase === 'completed' || phase === 'failed';
}

export async function pollRmpPricesBulkUploadStatus(
  options: PollRmpPricesBulkUploadOptions = {},
): Promise<RmpPricesBulkUploadStatus> {
  const intervalMs = options.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const minPollsBeforeIdleTerminal = options.minPollsBeforeIdleTerminal ?? 2;
  const startedAt = Date.now();
  let pollCount = 0;
  let lastStatus: RmpPricesBulkUploadStatus | null = null;

  while (true) {
    if (options.signal?.aborted) {
      throw new Error('Import cancelled');
    }

    const status = await fetchRmpPricesBulkUploadStatus();
    lastStatus = status;
    pollCount += 1;
    options.onProgress?.(status);

    if (isTerminalPhase(status.phase)) {
      return status;
    }

    if (status.phase === 'idle' && pollCount >= minPollsBeforeIdleTerminal) {
      return {
        ...status,
        phase: 'completed',
        message: status.message ?? 'Import finished',
      };
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(
        lastStatus?.message ??
          'Bulk import is taking longer than expected. Try again later or contact support.',
      );
    }

    await sleep(intervalMs, options.signal);
  }
}

export interface RunRmpPricesBulkImportOptions extends PollRmpPricesBulkUploadOptions {
  onUploadComplete?: (status: RmpPricesBulkUploadStatus) => void;
}

/** Upload CSV to Scott, then poll until the server reports a terminal state. */
export async function runRmpPricesBulkImport(
  file: File,
  options: RunRmpPricesBulkImportOptions = {},
): Promise<RmpPricesBulkUploadSaveResult> {
  const uploadStatus = await uploadRmpPricesBulk(file);
  options.onUploadComplete?.(uploadStatus);
  options.onProgress?.({
    ...uploadStatus,
    phase: uploadStatus.phase === 'idle' ? 'processing' : uploadStatus.phase,
  });

  if (uploadStatus.phase === 'completed') {
    return toBulkUploadSaveResult(uploadStatus);
  }
  if (uploadStatus.phase === 'failed') {
    throw new Error(uploadStatus.message ?? 'Bulk import failed during upload');
  }

  const finalStatus = await pollRmpPricesBulkUploadStatus(options);
  if (finalStatus.phase === 'failed') {
    throw new Error(finalStatus.message ?? 'Bulk import failed');
  }

  return toBulkUploadSaveResult(finalStatus);
}

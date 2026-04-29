import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar } from 'lucide-react';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';

interface ReportDownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onDownload: (filters: { startDate?: string; endDate?: string; status?: string }) => Promise<unknown[]>;
  headers: string[];
  fieldMap: Record<string, string | ((item: unknown) => string)>;
  entityName: string;
  showStatusFilter?: boolean;
  statusOptions?: { value: string; label: string }[];
}

const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({
  open,
  onOpenChange,
  title,
  onDownload,
  headers,
  fieldMap,
  entityName,
  showStatusFilter = false,
  statusOptions = [],
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filters: { startDate?: string; endDate?: string; status?: string } = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (status && showStatusFilter) filters.status = status;

      const data = await onDownload(filters);

      if (!data || data.length === 0) {
        alert('No data found for the selected filters');
        return;
      }

      exportToCSV({
        filename: generateExportFilename(entityName),
        headers,
        data,
        fieldMap,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatus('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {showStatusFilter && statusOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Status (optional)</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(startDate || endDate || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDownloadModal;

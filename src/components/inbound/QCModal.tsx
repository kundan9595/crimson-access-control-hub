import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Save, Loader2 } from 'lucide-react';
import { QCSessionService } from './services/qcSessionService';
import type { QCEntry, QCSessionSaveData, QCModalProps } from './types/qcTypes';

// Create a singleton service instance
const qcSessionService = new QCSessionService();

export const QCModal: React.FC<QCModalProps> = ({
  isOpen,
  onClose,
  poId,
  poNumber,
  vendorName,
  onRefresh
}) => {
  const [qcEntries, setQcEntries] = useState<QCEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load QC data when modal opens
  useEffect(() => {
    if (isOpen && poId) {
      loadQCData();
    }
  }, [isOpen, poId]);

  const loadQCData = async () => {
    try {
      setLoading(true);
      const entries = await qcSessionService.loadSessions(poId);
      setQcEntries(entries);
    } catch (error) {
      console.error('Error loading QC data:', error);
      toast.error('Failed to load QC data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (entryId: string, field: string, value: number) => {
    setQcEntries(prevEntries =>
      prevEntries.map(entry => {
        if (entry.id !== entryId) return entry;

        // Validation logic
        if (field === 'samples_checked') {
          // Samples checked cannot be negative
          if (value < 0) {
            toast.error('Samples checked cannot be negative');
            return entry;
          }
          
          // Samples checked cannot exceed received quantity
          if (value > entry.received_qty) {
            toast.error(`Samples checked cannot exceed received quantity (${entry.received_qty})`);
            return entry;
          }
        }
        
        if (field === 'samples_ok') {
          // Samples OK cannot be negative
          if (value < 0) {
            toast.error('Samples OK cannot be negative');
            return entry;
          }
          
          // Samples OK cannot exceed samples checked
          if (value > entry.samples_checked) {
            toast.error(`Samples OK cannot exceed samples checked (${entry.samples_checked})`);
            return entry;
          }
        }

        const updates: Partial<QCEntry> = { [field]: value };

        // Calculate derived fields
        if (field === 'samples_checked' || field === 'samples_ok') {
          const newSamplesChecked = field === 'samples_checked' ? value : entry.samples_checked;
          const newSamplesOk = field === 'samples_ok' ? value : entry.samples_ok;
          
          // If samples_checked is being reduced, adjust samples_ok if necessary
          if (field === 'samples_checked' && newSamplesOk > newSamplesChecked) {
            updates.samples_ok = newSamplesChecked;
            updates.samples_not_ok = 0;
            updates.qc_percentage = newSamplesChecked > 0 ? 100 : 0;
          } else {
            const newSamplesNotOk = Math.max(0, newSamplesChecked - newSamplesOk);
            const newQcPercentage = newSamplesChecked > 0 ? (newSamplesOk / newSamplesChecked) * 100 : 0;
            
            updates.samples_not_ok = newSamplesNotOk;
            updates.qc_percentage = Math.round(newQcPercentage * 100) / 100;
          }
        }

        return { ...entry, ...updates };
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate all entries before saving
      const validationErrors: string[] = [];
      
      qcEntries.forEach((entry, index) => {
        if (entry.samples_checked > 0) {
          // Validate samples checked
          if (entry.samples_checked > entry.received_qty) {
            validationErrors.push(`Row ${index + 1}: Samples checked (${entry.samples_checked}) cannot exceed received quantity (${entry.received_qty})`);
          }
          
          // Validate samples OK
          if (entry.samples_ok > entry.samples_checked) {
            validationErrors.push(`Row ${index + 1}: Samples OK (${entry.samples_ok}) cannot exceed samples checked (${entry.samples_checked})`);
          }
          
          // Validate samples not OK calculation
          const expectedNotOk = entry.samples_checked - entry.samples_ok;
          if (entry.samples_not_ok !== expectedNotOk) {
            validationErrors.push(`Row ${index + 1}: Samples Not OK should be ${expectedNotOk} (calculated as samples checked - samples OK)`);
          }
          
          // Validate QC percentage calculation
          const expectedPercentage = entry.samples_checked > 0 ? (entry.samples_ok / entry.samples_checked) * 100 : 0;
          if (Math.abs(entry.qc_percentage - expectedPercentage) > 0.01) {
            validationErrors.push(`Row ${index + 1}: QC percentage should be ${expectedPercentage.toFixed(2)}%`);
          }
        }
      });
      
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }
      
      // Prepare session data
      const sessionData: QCSessionSaveData[] = qcEntries
        .filter(entry => entry.samples_checked > 0)
        .map(entry => ({
          item_type: entry.item_type,
          item_id: crypto.randomUUID(),
          sku_id: entry.sku_id,
          size_id: entry.size_id,
          misc_name: entry.misc_name,
          received_qty: entry.received_qty,
          samples_checked: entry.samples_checked,
          samples_ok: entry.samples_ok,
          samples_not_ok: entry.samples_not_ok,
          qc_percentage: entry.qc_percentage
        }));

      if (sessionData.length === 0) {
        toast.error('No QC data to save');
        return;
      }

      // Generate session name
      const sessionName = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await qcSessionService.saveSession(poId, sessionName, sessionData);
      
      toast.success('QC report saved successfully');
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Error saving QC session:', error);
      toast.error('Failed to save QC report');
    } finally {
      setSaving(false);
    }
  };

  const hasValidData = qcEntries.some(entry => entry.samples_checked > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Quality Control - {poNumber}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Vendor: {vendorName}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading QC data...</span>
              </div>
            </div>
          ) : qcEntries.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-muted-foreground">No items available for quality control</span>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="space-y-4">
                {/* QC Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">SKU</th>
                        <th className="text-left p-3 font-medium">Item Name</th>
                        <th className="text-center p-3 font-medium">Received Qty</th>
                        <th className="text-center p-3 font-medium">Samples Checked</th>
                        <th className="text-center p-3 font-medium">Samples OK</th>
                        <th className="text-center p-3 font-medium">Samples Not OK</th>
                        <th className="text-center p-3 font-medium">QC%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qcEntries.map((entry) => (
                        <tr key={entry.id} className="border-t">
                          <td className="p-3">
                            <span className="font-medium">
                              {entry.item_type === 'sku' ? entry.sku_code : 'MISC'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">
                              {entry.item_type === 'sku' 
                                ? `${entry.sku_name} - ${entry.size_name}`
                                : entry.misc_name
                              }
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium">{entry.received_qty}</span>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              max={entry.received_qty}
                              value={entry.samples_checked}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                handleQuantityChange(entry.id, 'samples_checked', value);
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value > entry.received_qty) {
                                  e.target.value = entry.received_qty.toString();
                                  handleQuantityChange(entry.id, 'samples_checked', entry.received_qty);
                                }
                              }}
                              className="w-20 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              max={entry.samples_checked}
                              value={entry.samples_ok}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                handleQuantityChange(entry.id, 'samples_ok', value);
                              }}
                              onBlur={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value > entry.samples_checked) {
                                  e.target.value = entry.samples_checked.toString();
                                  handleQuantityChange(entry.id, 'samples_ok', entry.samples_checked);
                                }
                              }}
                              className="w-20 text-center"
                              disabled={entry.samples_checked === 0}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium text-red-600">
                              {entry.samples_not_ok}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium text-green-600">
                              {entry.qc_percentage.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !hasValidData}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save QC Report'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
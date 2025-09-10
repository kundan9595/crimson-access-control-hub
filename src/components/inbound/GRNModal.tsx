import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { GRNService, GRNItem, GRNSession } from '@/services/grnService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GRNEntry {
  id: string;
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  sku_code?: string;
  sku_name?: string;
  size_id?: string;
  size_name?: string;
  size_code?: string;
  misc_name?: string;
  ordered: number;
  pending: number;
  goodQuantity: number;
  badQuantity: number;
}

interface GRNTab {
  id: string;
  name: string;
  timestamp: Date;
  entries: GRNEntry[];
  isSaved: boolean;
}

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  poNumber: string;
  vendorName: string;
  onRefresh?: () => void;
}

const GRNModal: React.FC<GRNModalProps> = ({ isOpen, onClose, poId, poNumber, vendorName, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabs, setTabs] = useState<GRNTab[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [grnEntryId, setGrnEntryId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  console.log('🔍 GRNModal Render - isOpen:', isOpen, 'poId:', poId, 'activeTab:', activeTab, 'tabs.length:', tabs.length);

  // Load GRN data when modal opens
  useEffect(() => {
    console.log('🚀 useEffect triggered - isOpen:', isOpen, 'poId:', poId);
    if (isOpen && poId && tabs.length === 0) {
      console.log('📞 Calling loadGRNData...');
      loadGRNData();
    }
    
    // Reset state when modal closes
    if (!isOpen) {
      setTabs([]);
      setActiveTab('');
      setGrnEntryId(null);
      setLoading(false);
      setSaving(false);
      setValidationErrors({});
    }
  }, [isOpen, poId]);

  // Set active tab when tabs change (backup mechanism)
  useEffect(() => {
    console.log('🔄 Tab useEffect triggered - tabs.length:', tabs.length, 'activeTab:', activeTab);
    if (tabs.length > 0 && !activeTab) {
      const latestTabId = tabs.length > 1 ? tabs[tabs.length - 1].id : tabs[0].id;
      console.log('🎯 Setting active tab from useEffect (backup):', latestTabId);
      setActiveTab(latestTabId);
    }
  }, [tabs, activeTab]);

  // Calculate pending quantities dynamically for all sessions
  const calculatePendingQuantities = (allTabs: GRNTab[]): GRNTab[] => {
    return allTabs.map(tab => {
      if (tab.isSaved) {
        // For saved sessions, calculate what was pending at the time this session was saved
        // This means: ordered - (total received from all sessions up to this point)
        const updatedEntries = tab.entries.map(entry => {
          let totalReceivedUpToThisSession = 0;
          
          // Calculate total received from all sessions up to and including this session
          // We need to sort sessions by timestamp to get the correct order
          const sortedTabs = [...allTabs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          for (const sessionTab of sortedTabs) {
            if (sessionTab.isSaved) {
              const sessionEntry = sessionTab.entries.find(e => e.id === entry.id);
              if (sessionEntry) {
                totalReceivedUpToThisSession += (sessionEntry.goodQuantity || 0) + (sessionEntry.badQuantity || 0);
              }
              
              // If we've reached the current tab, stop here
              if (sessionTab.id === tab.id) {
                break;
              }
            }
          }
          
          const remainingPending = Math.max(0, entry.ordered - totalReceivedUpToThisSession);
          
          return {
            ...entry,
            pending: remainingPending
          };
        });
        
        return {
          ...tab,
          entries: updatedEntries
        };
      } else {
        // For Today tab, calculate pending based on all saved sessions
        const updatedEntries = tab.entries.map(entry => {
          let totalReceivedFromAllSavedSessions = 0;
          
          allTabs.forEach(savedTab => {
            if (savedTab.isSaved) {
              const savedEntry = savedTab.entries.find(e => e.id === entry.id);
              if (savedEntry) {
                totalReceivedFromAllSavedSessions += (savedEntry.goodQuantity || 0) + (savedEntry.badQuantity || 0);
              }
            }
          });
          
          const remainingPending = Math.max(0, entry.ordered - totalReceivedFromAllSavedSessions);
          
          return {
            ...entry,
            pending: remainingPending
          };
        });
        
        return {
          ...tab,
          entries: updatedEntries
        };
      }
    });
  };

  const loadGRNData = async () => {
    try {
      console.log('📊 Starting loadGRNData for poId:', poId);
      setLoading(true);
      
      // Get PO status first
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', poId)
        .single();

      if (poError) {
        console.error('❌ Error fetching PO status:', poError);
        throw new Error(`Failed to fetch PO status: ${poError.message}`);
      }

      const poStatus = poData?.status;
      console.log('📊 PO Status:', poStatus);
      
      // Get or create GRN entry and load sessions
      const { grnEntryId: entryId, sessions, items } = await GRNService.getOrCreateGRNEntry(poId);
      console.log('📦 Data loaded - entryId:', entryId, 'sessions:', sessions.length, 'items:', items.length);
      setGrnEntryId(entryId);

      // Convert database items to GRN entries
      const grnEntries: GRNEntry[] = items.map((item, index) => {
        const entry = {
          id: item.item_type === 'sku' ? `${item.sku_id}-${item.size_id}` : item.item_id,
          item_type: item.item_type,
          item_id: item.item_id,
          sku_id: item.sku_id,
          sku_code: item.sku_code,
          sku_name: item.sku_name,
          size_id: item.size_id,
          size_name: item.size_name,
          size_code: item.size_code,
          misc_name: item.misc_name,
          ordered: item.ordered_quantity || 0,
          pending: item.ordered_quantity || 0, // Initial pending equals ordered
          goodQuantity: 0,
          badQuantity: 0
        };
        console.log(`📋 Converting item ${index}:`, item, '→', entry);
        console.log(`📋 Item ordered_quantity:`, item.ordered_quantity, 'Mapped ordered:', entry.ordered);
        return entry;
      });

      console.log('🔄 Converted GRN entries:', grnEntries);

      // Convert database sessions to tabs (filter out null sessions)
      console.log('📊 Raw sessions from database:', sessions);
      
      const grnTabs: GRNTab[] = sessions
        .filter(session => session.session_id !== null) // Filter out null sessions
        .map(session => {
          console.log('📋 Processing session:', session.session_id, session.session_name);
          console.log('📋 Session items:', session.items);
          
          const tabEntries = session.items.map(item => {
            console.log('🔍 Looking for base entry for item:', item);
            console.log('🔍 Available base entries:', grnEntries.map(e => ({ 
              item_type: e.item_type, 
              sku_id: e.sku_id, 
              size_id: e.size_id, 
              item_id: e.item_id,
              misc_name: e.misc_name 
            })));
            
            const baseEntry = grnEntries.find(entry => {
              let match = false;
              
              if (entry.item_type === 'sku' && item.item_type === 'sku') {
                match = entry.sku_id === item.sku_id && entry.size_id === item.size_id;
              } else if (entry.item_type === 'misc' && item.item_type === 'misc') {
                // For misc items, match by misc_name
                match = entry.misc_name === item.misc_name;
              }
              
              console.log('🔍 Comparing:', {
                entry_type: entry.item_type,
                entry_sku_id: entry.sku_id,
                entry_size_id: entry.size_id,
                entry_misc_name: entry.misc_name,
                item_type: item.item_type,
                item_sku_id: item.sku_id,
                item_size_id: item.size_id,
                item_misc_name: item.misc_name,
                match: match
              });
              
              return match;
            });
            
            if (!baseEntry) {
              console.log('⚠️ No base entry found for item:', item);
              return null;
            }

            const sessionEntry = {
              ...baseEntry,
              ordered: baseEntry.ordered || baseEntry.ordered_quantity || 0,
              pending: 0, // Will be calculated dynamically
              goodQuantity: item.good_quantity || 0,
              badQuantity: item.bad_quantity || 0
            };
            console.log('✅ Created session entry:', sessionEntry);
            return sessionEntry;
          }).filter(Boolean) as GRNEntry[];
          
          const tab = {
            id: session.session_id!,
            name: session.session_name!,
            timestamp: new Date(session.session_timestamp!),
            entries: tabEntries,
            isSaved: session.is_saved!
          };
          console.log('📋 Created tab:', tab);
          return tab;
        });

      // Determine if we should show the Today tab based on PO status
      const shouldShowTodayTab = poStatus === 'sent_to_vendor' || poStatus === 'partially_received';
      
      if (shouldShowTodayTab) {
        // Calculate remaining pending quantities for Today tab
        const remainingEntries = grnEntries.map(baseEntry => {
          let totalReceived = 0;
          
          // Sum up all received quantities from saved sessions
          grnTabs.forEach(tab => {
            if (tab.isSaved) {
              const sessionEntry = tab.entries.find(entry => 
                entry.item_type === 'sku' 
                  ? (entry.sku_id === baseEntry.sku_id && entry.size_id === baseEntry.size_id)
                  : entry.item_id === baseEntry.item_id
              );
              if (sessionEntry) {
                totalReceived += sessionEntry.goodQuantity + sessionEntry.badQuantity;
              }
            }
          });
          
          const originalOrdered = baseEntry.ordered || baseEntry.ordered_quantity || 0;
          const remainingPending = Math.max(0, originalOrdered - totalReceived);
          
          return {
            ...baseEntry,
            ordered: originalOrdered,
            pending: remainingPending,
            goodQuantity: 0,
            badQuantity: 0
          };
        });

        // Create "Today" tab
        console.log('📅 Creating "Today" tab based on PO status:', poStatus);
        grnTabs.push({
          id: 'today',
          name: 'Today',
          timestamp: new Date(),
          entries: remainingEntries,
          isSaved: false
        });
      } else {
        console.log('🎉 PO is fully received! No need to create Today tab.');
      }

      // Calculate pending quantities dynamically for all tabs
      const tabsWithCalculatedPending = calculatePendingQuantities(grnTabs);
      setTabs(tabsWithCalculatedPending);
      
      // Set active tab
      if (tabsWithCalculatedPending.length > 0) {
        const latestTabId = tabsWithCalculatedPending.length > 1 ? tabsWithCalculatedPending[tabsWithCalculatedPending.length - 1].id : tabsWithCalculatedPending[0].id;
        console.log('🎯 Setting active tab:', latestTabId);
        setActiveTab(latestTabId);
      } else {
        console.log('⚠️ No tabs created!');
      }
      
      // Debug logging
      console.log('📊 GRN Tabs created:', grnTabs);
      console.log('📊 GRN Entries:', grnEntries);

    } catch (error) {
      console.error('❌ Error loading GRN data:', error);
      toast.error('Failed to load GRN data');
    } finally {
      console.log('🏁 loadGRNData completed');
      setLoading(false);
    }
  };

  const handleQuantityChange = (tabId: string, entryId: string, field: 'goodQuantity' | 'badQuantity', value: number) => {
    const errorKey = `${tabId}-${entryId}-${field}`;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === tabId) {
          return {
            ...tab,
            entries: tab.entries.map(entry => {
              if (entry.id === entryId) {
                const newGoodQuantity = field === 'goodQuantity' ? value : (entry.goodQuantity || 0);
                const newBadQuantity = field === 'badQuantity' ? value : (entry.badQuantity || 0);
                const totalEntered = newGoodQuantity + newBadQuantity;
                
                // Clear any existing validation error
                setValidationErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[errorKey];
                  return newErrors;
                });
                
                // Get the original pending quantity (before any modifications in this session)
                // We need to find the base entry to get the original pending quantity
                const originalPending = entry.ordered || 0;
                
                // Calculate how much has been received in previous saved sessions
                let totalReceivedInSavedSessions = 0;
                prevTabs.forEach(savedTab => {
                  if (savedTab.isSaved && savedTab.id !== tabId) {
                    const savedEntry = savedTab.entries.find(e => e.id === entryId);
                    if (savedEntry) {
                      totalReceivedInSavedSessions += (savedEntry.goodQuantity || 0) + (savedEntry.badQuantity || 0);
                    }
                  }
                });
                
                // Calculate the actual pending quantity (original ordered - total received in saved sessions)
                const actualPending = Math.max(0, originalPending - totalReceivedInSavedSessions);
                
                // Don't allow total to exceed the actual pending quantity
                if (totalEntered > actualPending) {
                  const errorMessage = `Total quantity cannot exceed pending amount (${actualPending})`;
                  setValidationErrors(prev => ({
                    ...prev,
                    [errorKey]: errorMessage
                  }));
                  toast.error(errorMessage);
                  return entry; // Return unchanged entry
                }
                
                // Calculate new pending based on actual pending minus total entered
                const newPending = Math.max(0, actualPending - totalEntered);
                
                return {
                  ...entry,
                  [field]: value,
                  pending: newPending
                };
              }
              return entry;
            })
          };
        }
        return tab;
      })
    );
  };

  const handleSave = async (tabId: string) => {
    if (!grnEntryId) {
      toast.error('GRN entry not found');
      return;
    }

    try {
      setSaving(true);
      const currentTab = tabs.find(tab => tab.id === tabId);
      
      if (!currentTab) {
        toast.error('Tab not found');
        return;
      }

      // Prepare session data for database
      console.log('🔍 Current tab entries before saving:', currentTab.entries);
      
      const sessionData = currentTab.entries.map(entry => {
        const sessionItem = {
          item_type: entry.item_type,
          item_id: entry.item_id, // This should be the original PO item ID
          sku_id: entry.sku_id,
          size_id: entry.size_id,
          misc_name: entry.misc_name,
          ordered_quantity: entry.ordered,
          good_quantity: entry.goodQuantity,
          bad_quantity: entry.badQuantity
        };
        console.log('📦 Session item being saved:', sessionItem);
        return sessionItem;
      });
      
      console.log('📊 Final session data to save:', sessionData);

      // Save to database
      const sessionName = currentTab.isSaved ? 
        `Session ${new Date().toLocaleString()}` : 
        new Date().toLocaleString();

      await GRNService.saveGRNSession(grnEntryId, sessionName, sessionData);

      // Update purchase order status based on GRN receipts
      await GRNService.updatePurchaseOrderStatus(grnEntryId);

      // Mark current tab as saved and update its name to the saved session name
      setTabs(prevTabs => 
        prevTabs.map(tab => {
          if (tab.id === tabId) {
            return { ...tab, isSaved: true, name: sessionName };
          }
          return tab;
        })
      );

      // Reload GRN data to get updated PO status and create Today tab if needed
      console.log('🔄 Reloading GRN data after save...');
      await loadGRNData();

      // Notify parent component to refresh the PO list
      if (onRefresh) {
        onRefresh();
      }

    } catch (error) {
      console.error('Error saving GRN session:', error);
      toast.error('Failed to save GRN session');
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      toast.error('Session not found');
      return;
    }

    // Only prevent deletion of unsaved tabs (current working session)
    if (!tab.isSaved) {
      toast.error('Cannot delete unsaved sessions');
      return;
    }

    setSessionToDelete(tabId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    try {
      setDeleting(sessionToDelete);
      console.log('🗑️ Deleting session:', sessionToDelete);

      // Delete from database
      if (grnEntryId) {
        await GRNService.deleteGRNSession(sessionToDelete, grnEntryId);
        
        // Update purchase order status after deletion
        await GRNService.updatePurchaseOrderStatus(grnEntryId);
      }

      // Reload GRN data to get the correct state after deletion
      console.log('🔄 Reloading GRN data after deletion...');
      await loadGRNData();

      // Notify parent component to refresh the PO list
      if (onRefresh) {
        onRefresh();
      }

      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setSessionToDelete(null);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">GRN - {poNumber}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Vendor: {vendorName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading GRN data...</span>
              </div>
            </div>
          ) : (
            <Tabs 
              value={activeTab || tabs[0]?.id || ''} 
              onValueChange={(value) => {
                console.log('🔄 Tabs onValueChange called with:', value);
                setActiveTab(value);
              }} 
              className="h-full"
            >
            <TabsList className="flex justify-start w-full bg-transparent border-none">
              {tabs.map((tab) => {
                console.log('🎨 Rendering tab:', tab.id, tab.name, 'activeTab:', activeTab);
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary group"
                  >
                    <span>{tab.isSaved ? formatTimestamp(tab.timestamp) : tab.name}</span>
                    {tab.isSaved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(tab.id);
                        }}
                        disabled={deleting === tab.id}
                      >
                        {deleting === tab.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="h-full mt-4">
                <div className="h-full overflow-auto">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {tab.name}
                      </h3>
                    </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Item Code</TableHead>
                            <TableHead className="w-[300px]">Item Name</TableHead>
                            <TableHead className="text-center w-[100px]">Ordered</TableHead>
                            <TableHead className="text-center w-[120px]">Good Qty</TableHead>
                            <TableHead className="text-center w-[120px]">Bad Qty</TableHead>
                            <TableHead className="text-center w-[100px]">Total Received</TableHead>
                            <TableHead className="text-center w-[100px]">Pending</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tab.entries.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="text-muted-foreground">No items found for this session</div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            tab.entries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">
                                  {entry.item_type === 'sku' ? entry.sku_code : 'MISC'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {entry.item_type === 'sku' 
                                    ? `${entry.sku_name} - ${entry.size_name}`
                                    : entry.misc_name
                                  }
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {(entry.ordered || 0).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={(entry.pending || 0) - (entry.badQuantity || 0)}
                                      value={entry.goodQuantity || 0}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        if (value < 0) return;
                                        handleQuantityChange(tab.id, entry.id, 'goodQuantity', value);
                                      }}
                                      className={`text-center ${validationErrors[`${tab.id}-${entry.id}-goodQuantity`] ? 'border-red-500 focus:border-red-500' : ''}`}
                                      disabled={tab.isSaved}
                                      placeholder="0"
                                    />
                                    {validationErrors[`${tab.id}-${entry.id}-goodQuantity`] && (
                                      <p className="text-xs text-red-500">{validationErrors[`${tab.id}-${entry.id}-goodQuantity`]}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={(entry.pending || 0) - (entry.goodQuantity || 0)}
                                      value={entry.badQuantity || 0}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        if (value < 0) return;
                                        handleQuantityChange(tab.id, entry.id, 'badQuantity', value);
                                      }}
                                      className={`text-center ${validationErrors[`${tab.id}-${entry.id}-badQuantity`] ? 'border-red-500 focus:border-red-500' : ''}`}
                                      disabled={tab.isSaved}
                                      placeholder="0"
                                    />
                                    {validationErrors[`${tab.id}-${entry.id}-badQuantity`] && (
                                      <p className="text-xs text-red-500">{validationErrors[`${tab.id}-${entry.id}-badQuantity`]}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {((entry.goodQuantity || 0) + (entry.badQuantity || 0)).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={(entry.pending || 0) === 0 ? "secondary" : "default"}
                                    className={(entry.pending || 0) === 0 ? "bg-green-100 text-green-800" : ""}
                                  >
                                    {(entry.pending || 0).toLocaleString()}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>


                      
                      {!tab.isSaved && (
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={() => handleSave(tab.id)}
                            disabled={saving}
                            className="flex items-center gap-2"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently remove all data associated with this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting !== null}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default GRNModal;

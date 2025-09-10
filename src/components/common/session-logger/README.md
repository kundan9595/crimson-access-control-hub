# Session-Based Activity Logger

A reusable, modular system for implementing session-based activity logging in warehouse management operations. Originally extracted from the GRN (Goods Receipt Note) modal, this system provides a consistent pattern for activities like receiving goods, put-away operations, returns processing, and more.

## Overview

The Session-Based Activity Logger provides:
- **Session Management**: Create, save, delete, and manage activity sessions
- **Quantity Validation**: Built-in validation for quantity inputs with customizable rules
- **Pending Calculations**: Automatic calculation of pending quantities across sessions
- **Reusable Components**: Generic UI components that can be customized for different activities
- **Type Safety**: Full TypeScript support with generic types

## Architecture

### Core Components

1. **SessionLoggerModal**: Main modal wrapper component
2. **SessionTabs**: Tab management with delete functionality
3. **SessionTable**: Configurable table for displaying and editing data
4. **useSessionManager**: Core hook for session state management
5. **useQuantityValidation**: Hook for quantity validation logic
6. **usePendingCalculations**: Hook for pending quantity calculations

### Key Concepts

- **Session**: A collection of activity entries with a timestamp and save state
- **Activity Entry**: Individual items being processed (extends BaseActivityEntry)
- **Service**: Interface for loading, saving, and deleting sessions from storage

## Usage

### 1. Define Your Activity Types

```typescript
import type { BaseActivityEntry, ActivitySession } from '@/components/common/session-logger';

interface MyActivityEntry extends BaseActivityEntry {
  // Add your specific fields
  quantity: number;
  location?: string;
  notes?: string;
  pending: number;
}

type MyActivitySession = ActivitySession<MyActivityEntry>;

interface MyActivitySaveData {
  // Define the structure for saving to database
  item_type: 'sku' | 'misc';
  item_id: string;
  quantity: number;
  location?: string;
}
```

### 2. Implement a Service

```typescript
import type { SessionService } from '@/components/common/session-logger';

class MyActivityService implements SessionService<MyActivityEntry, MyActivitySaveData> {
  async loadSessions(referenceId: string): Promise<MyActivitySession[]> {
    // Load sessions from your database
  }

  async saveSession(referenceId: string, sessionName: string, sessionData: MyActivitySaveData[]): Promise<string> {
    // Save session to your database
  }

  async deleteSession(sessionId: string, referenceId: string): Promise<void> {
    // Delete session from your database
  }

  async updateStatus?(referenceId: string): Promise<void> {
    // Optional: Update parent record status
  }
}
```

### 3. Create Your Modal Component

```typescript
import React from 'react';
import {
  SessionLoggerModal,
  useSessionManager,
  useQuantityValidation,
  usePendingCalculations
} from '@/components/common/session-logger';

export const MyActivityModal: React.FC<Props> = ({ isOpen, onClose, referenceId }) => {
  const service = new MyActivityService();

  const { validateQuantityEntry } = useQuantityValidation<MyActivityEntry>();
  
  const sessionManager = useSessionManager<MyActivityEntry, MyActivitySaveData>({
    referenceId,
    service,
    validateEntry: validateQuantityEntry,
    prepareSessionData: (entries) => entries.map(entry => ({
      item_type: entry.item_type,
      item_id: entry.item_id,
      quantity: entry.quantity
    }))
  });

  const tableColumns = [
    { key: 'item_code', header: 'Item Code', width: '200px' },
    { key: 'quantity', header: 'Quantity', width: '120px', align: 'center' }
  ];

  const quantityInputs = [
    {
      field: 'quantity',
      label: 'Quantity',
      min: 0,
      max: (entry: MyActivityEntry) => entry.pending
    }
  ];

  return (
    <SessionLoggerModal
      isOpen={isOpen}
      onClose={onClose}
      title="My Activity"
      sessionManager={sessionManager}
      tableColumns={tableColumns}
      quantityInputs={quantityInputs}
      onQuantityChange={(sessionId, entryId, field, value) => {
        sessionManager.updateEntry(sessionId, entryId, { [field]: value });
      }}
    />
  );
};
```

## Configuration Options

### SessionManagerConfig

```typescript
interface SessionManagerConfig {
  maxPendingExceedance?: boolean;        // Allow exceeding pending quantities
  allowNegativeQuantities?: boolean;     // Allow negative quantity inputs
  autoSave?: boolean;                    // Auto-save sessions
  sessionNameFormat?: (timestamp: Date) => string; // Custom session naming
}
```

### Validation Configuration

```typescript
const { validateQuantityEntry } = useQuantityValidation<MyEntry>({
  allowNegative: false,
  maxExceedanceAllowed: false,
  customValidators: [myCustomValidator]
});
```

### Pending Calculations Configuration

```typescript
const { calculateAllPendingQuantities } = usePendingCalculations<MyEntry>({
  includeGoodQuantity: true,
  includeBadQuantity: true,
  includeQuantity: false,
  customCalculation: myCustomCalculation
});
```

## Examples

### GRN (Goods Receipt Note)
- **Purpose**: Record received goods with good/bad quantities
- **Fields**: goodQuantity, badQuantity, pending
- **Validation**: Total quantities cannot exceed pending amounts

### Put Away
- **Purpose**: Assign warehouse locations to received goods
- **Fields**: warehouse_id, floor_id, lane_id, rack_id, quantity
- **Validation**: Cannot put away more than available quantity

### Returns Processing
- **Purpose**: Process returned items with reasons and conditions
- **Fields**: return_reason, condition, quantity, notes
- **Validation**: Cannot return more than available quantity

## Database Integration

The system expects your database to have:
1. **Main Records**: Reference records (POs, GRNs, Orders, etc.)
2. **Session Records**: Sessions with names, timestamps, and save status
3. **Item Records**: Individual activity items within sessions

Example database structure:
```sql
-- Main activity records
CREATE TABLE activity_entries (
  id UUID PRIMARY KEY,
  reference_id UUID NOT NULL,
  reference_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session records
CREATE TABLE activity_sessions (
  id UUID PRIMARY KEY,
  activity_entry_id UUID REFERENCES activity_entries(id),
  session_name TEXT NOT NULL,
  session_timestamp TIMESTAMP DEFAULT NOW(),
  is_saved BOOLEAN DEFAULT FALSE
);

-- Item records within sessions
CREATE TABLE activity_items (
  id UUID PRIMARY KEY,
  activity_entry_id UUID REFERENCES activity_entries(id),
  session_name TEXT NOT NULL,
  item_type TEXT CHECK (item_type IN ('sku', 'misc')),
  sku_id UUID,
  size_id UUID,
  misc_name TEXT,
  -- Activity-specific fields
  quantity INTEGER DEFAULT 0,
  -- Add other fields as needed
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Best Practices

1. **Type Safety**: Always extend BaseActivityEntry for your specific needs
2. **Validation**: Implement proper validation rules for your business logic
3. **Error Handling**: Handle service errors gracefully with user-friendly messages
4. **Performance**: Use pagination or virtualization for large datasets
5. **Accessibility**: Ensure all inputs have proper labels and ARIA attributes
6. **Testing**: Write unit tests for your service implementations and validation logic

## Migration from Existing Modals

To migrate an existing modal to use this system:

1. **Extract Types**: Move your entry types to extend BaseActivityEntry
2. **Create Service**: Implement SessionService interface with your existing API calls
3. **Replace Components**: Use SessionLoggerModal instead of custom modal
4. **Move Logic**: Transfer validation and calculation logic to hooks
5. **Test**: Ensure all functionality works with the new system

## Troubleshooting

### Common Issues

1. **Sessions not loading**: Check service implementation and network requests
2. **Validation errors**: Ensure validation functions return proper error messages
3. **Pending calculations wrong**: Verify calculation logic in usePendingCalculations
4. **Save failures**: Check prepareSessionData function and service save method

### Debugging

Enable debug logging:
```typescript
const sessionManager = useSessionManager({
  // ... other options
  config: { debug: true }
});
```

This will log session operations to the browser console for troubleshooting.

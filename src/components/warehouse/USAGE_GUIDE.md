# Warehouse Modal Implementations Usage Guide

This guide covers the actual implementations of the Put Away and Return modals using the Session-Based Activity Logger system.

## 🏗️ **Architecture Overview**

Both modals are built on the Session-Based Activity Logger system, providing:
- ✅ **Session Management**: Create, save, delete warehouse activity sessions
- ✅ **Location Assignment**: Full warehouse location hierarchy (Warehouse → Floor → Lane → Rack)
- ✅ **Validation**: Business logic validation for warehouse operations
- ✅ **Real-time Updates**: Automatic pending quantity calculations
- ✅ **Type Safety**: Full TypeScript support with warehouse-specific types

## 📦 **Put Away Modal**

### **Purpose**
Assign warehouse locations to items received through GRN (Goods Receipt Note).

### **Usage**

```typescript
import { PutAwayModal } from '@/components/warehouse';

function MyComponent() {
  const [isPutAwayOpen, setIsPutAwayOpen] = useState(false);

  return (
    <PutAwayModal
      isOpen={isPutAwayOpen}
      onClose={() => setIsPutAwayOpen(false)}
      grnId="grn-uuid-here"
      grnNumber="GRN-2025-001"
      onRefresh={() => {
        // Refresh parent data after put away completion
        refetchGRNData();
      }}
    />
  );
}
```

### **Features**

1. **Location Hierarchy Selection**
   - Warehouse dropdown (from existing warehouses)
   - Floor dropdown (filtered by selected warehouse)
   - Lane dropdown (filtered by selected floor)
   - Rack dropdown (filtered by selected lane)

2. **Smart Validation**
   - Quantity cannot exceed available amount
   - All location fields required when quantity > 0
   - Real-time location availability checking

3. **Session Management**
   - Multiple put away sessions per GRN
   - Save/delete put away sessions
   - Historical session tracking

### **Data Flow**
1. Loads items from GRN that have good quantities
2. Shows existing put away sessions
3. Creates "Today" session for new put away operations
4. Validates location assignments
5. Updates warehouse inventory locations

## 🔄 **Return Modal**

### **Purpose**
Process returns for various types of items (customer returns, damaged goods, etc.).

### **Usage**

```typescript
import { ReturnModal } from '@/components/warehouse';

function MyComponent() {
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  return (
    <ReturnModal
      isOpen={isReturnOpen}
      onClose={() => setIsReturnOpen(false)}
      referenceId="order-uuid-here"
      referenceType="order" // 'order' | 'grn' | 'inventory'
      referenceNumber="ORD-2025-001"
      onRefresh={() => {
        // Refresh parent data after return processing
        refetchOrderData();
      }}
    />
  );
}
```

### **Features**

1. **Return Reason Tracking**
   - Damaged
   - Defective
   - Wrong Item
   - Excess Stock
   - Customer Return

2. **Item Condition Assessment**
   - Good
   - Damaged
   - Defective

3. **Detailed Documentation**
   - Return location assignment
   - Notes and damage descriptions
   - Customer order references

4. **Visual Status Indicators**
   - Color-coded reason badges
   - Condition status indicators
   - Session history tracking

### **Data Flow**
1. Loads items available for return from reference
2. Shows existing return sessions
3. Creates "Today" session for new returns
4. Validates return reasons and conditions
5. Updates inventory and reference status

## 🔧 **Required Database Functions**

The implementations expect these database functions to exist:

### **Put Away Functions**

```sql
-- Get items available for put away from a GRN
CREATE OR REPLACE FUNCTION get_putaway_items_for_grn(p_grn_id UUID)
RETURNS TABLE (
  item_type TEXT,
  item_id UUID,
  sku_id UUID,
  sku_code TEXT,
  sku_name TEXT,
  size_id UUID,
  size_name TEXT,
  size_code TEXT,
  misc_name TEXT,
  good_quantity INTEGER
);

-- Get existing put away sessions for a GRN
CREATE OR REPLACE FUNCTION get_putaway_sessions(p_grn_id UUID)
RETURNS TABLE (
  session_id TEXT,
  session_name TEXT,
  session_timestamp TIMESTAMPTZ,
  is_saved BOOLEAN,
  items JSONB
);

-- Save a put away session
CREATE OR REPLACE FUNCTION save_putaway_session(
  p_grn_id UUID,
  p_session_name TEXT,
  p_session_data JSONB
)
RETURNS TEXT;

-- Delete a put away session
CREATE OR REPLACE FUNCTION delete_putaway_session(
  p_grn_id UUID,
  p_session_name TEXT
)
RETURNS VOID;

-- Update GRN put away status
CREATE OR REPLACE FUNCTION update_grn_putaway_status(p_grn_id UUID)
RETURNS VOID;
```

### **Return Functions**

```sql
-- Get items available for return from a reference
CREATE OR REPLACE FUNCTION get_return_items_for_reference(p_reference_id UUID)
RETURNS TABLE (
  item_type TEXT,
  item_id UUID,
  sku_id UUID,
  sku_code TEXT,
  sku_name TEXT,
  size_id UUID,
  size_name TEXT,
  size_code TEXT,
  misc_name TEXT,
  available_quantity INTEGER,
  customer_order_id UUID
);

-- Get existing return sessions for a reference
CREATE OR REPLACE FUNCTION get_return_sessions(p_reference_id UUID)
RETURNS TABLE (
  session_id TEXT,
  session_name TEXT,
  session_timestamp TIMESTAMPTZ,
  is_saved BOOLEAN,
  items JSONB
);

-- Save a return session
CREATE OR REPLACE FUNCTION save_return_session(
  p_reference_id UUID,
  p_session_name TEXT,
  p_session_data JSONB
)
RETURNS TEXT;

-- Delete a return session
CREATE OR REPLACE FUNCTION delete_return_session(
  p_reference_id UUID,
  p_session_name TEXT
)
RETURNS VOID;

-- Update reference return status
CREATE OR REPLACE FUNCTION update_reference_return_status(p_reference_id UUID)
RETURNS VOID;
```

## 📊 **Database Tables**

### **Put Away Tables (Simplified)**

**✨ Simplified from 3 tables to 2 tables for better maintainability**

```sql
-- Put away sessions (combines old entries + sessions)
CREATE TABLE putaway_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_entry_id UUID NOT NULL REFERENCES grn_entries(id),
  session_name TEXT NOT NULL,
  session_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_saved BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  -- Ensure unique session names per GRN
  UNIQUE(grn_entry_id, session_name)
);

-- Individual put away items
CREATE TABLE putaway_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  putaway_session_id UUID NOT NULL REFERENCES putaway_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('sku', 'misc')),
  sku_id UUID REFERENCES skus(id),
  size_id UUID REFERENCES sizes(id),
  misc_name TEXT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  floor_id UUID NOT NULL REFERENCES warehouse_floors(id),
  lane_id UUID NOT NULL REFERENCES warehouse_lanes(id),
  rack_id UUID NOT NULL REFERENCES warehouse_racks(id),
  quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
  location_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure data integrity
  CONSTRAINT putaway_items_sku_required 
    CHECK ((item_type = 'sku' AND sku_id IS NOT NULL AND size_id IS NOT NULL AND misc_name IS NULL) 
           OR (item_type = 'misc' AND sku_id IS NULL AND size_id IS NULL AND misc_name IS NOT NULL))
);
```

### **Return Tables**

```sql
-- Return entries (main records)
CREATE TABLE return_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('order', 'grn', 'inventory')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Return sessions
CREATE TABLE return_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_entry_id UUID REFERENCES return_entries(id),
  session_name TEXT NOT NULL,
  session_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_saved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id)
);

-- Individual return items
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_entry_id UUID REFERENCES return_entries(id),
  session_name TEXT NOT NULL,
  item_type TEXT CHECK (item_type IN ('sku', 'misc')),
  sku_id UUID REFERENCES skus(id),
  size_id UUID REFERENCES sizes(id),
  misc_name TEXT,
  return_reason TEXT NOT NULL CHECK (return_reason IN ('damaged', 'defective', 'wrong_item', 'excess', 'customer_return')),
  condition TEXT NOT NULL CHECK (condition IN ('good', 'damaged', 'defective')),
  quantity INTEGER DEFAULT 0,
  notes TEXT,
  customer_order_id UUID,
  return_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

## 🎨 **Customization**

### **Custom Validation Rules**

```typescript
// Add custom validation to put away modal
const customPutAwayValidation = (entry: PutAwayEntry, sessions: PutAwaySession[], sessionId: string): string | null => {
  // Check if rack has capacity
  if (entry.rack_id && entry.quantity > 0) {
    const rackCapacity = await checkRackCapacity(entry.rack_id);
    if (entry.quantity > rackCapacity) {
      return `Rack capacity exceeded. Available: ${rackCapacity}`;
    }
  }
  return null;
};
```

### **Custom Location Logic**

```typescript
// Add location suggestions based on item type
const suggestOptimalLocation = (entry: PutAwayEntry): LocationSuggestion => {
  // Implement your location optimization logic
  return {
    warehouse_id: 'optimal-warehouse',
    floor_id: 'optimal-floor',
    lane_id: 'optimal-lane',
    rack_id: 'optimal-rack'
  };
};
```

## 🚀 **Integration Steps**

1. **Create Database Functions**: Implement the required database functions
2. **Create Database Tables**: Set up the necessary tables
3. **Import Components**: Import the modal components in your code
4. **Add Trigger Buttons**: Add buttons to open the modals from your UI
5. **Handle Callbacks**: Implement refresh callbacks to update parent data

## 🧪 **Testing**

```typescript
// Test put away modal
import { render, screen, fireEvent } from '@testing-library/react';
import { PutAwayModal } from '@/components/warehouse';

test('put away modal assigns locations correctly', async () => {
  render(
    <PutAwayModal
      isOpen={true}
      onClose={jest.fn()}
      grnId="test-grn-id"
      grnNumber="GRN-TEST-001"
    />
  );
  
  // Test location selection
  const warehouseSelect = screen.getByLabelText('Warehouse');
  fireEvent.change(warehouseSelect, { target: { value: 'warehouse-1' } });
  
  // Test quantity input
  const quantityInput = screen.getByLabelText('Put Away Quantity');
  fireEvent.change(quantityInput, { target: { value: '10' } });
  
  // Test save
  const saveButton = screen.getByText('Put Away Items');
  fireEvent.click(saveButton);
  
  // Assert success
  expect(screen.getByText('Put away session saved successfully')).toBeInTheDocument();
});
```

## 📝 **Notes**

- Both modals inherit all Session-Based Activity Logger features
- Location hierarchy is automatically filtered based on selections
- Validation happens in real-time as users make changes
- Sessions are automatically saved with timestamps
- All operations are logged for audit purposes
- Components are fully accessible with proper ARIA labels

## 🔗 **Related Documentation**

- [Session-Based Activity Logger](../common/session-logger/README.md)
- [Warehouse Structure Hook](../../hooks/warehouse/useWarehouseStructure.ts)
- [GRN Modal Implementation](../inbound/GRNModalNew.tsx)

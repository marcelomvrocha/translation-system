# Technical Implementation Guide - Translation Grid Enhancements

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm/yarn package manager
- Git for version control
- Code editor (VS Code recommended)

### Environment Setup
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Install new dependencies for export functionality
cd frontend && npm install xlsx file-saver
npm install --save-dev @types/file-saver
```

---

## 📁 File Structure

```
frontend/src/pages/
├── TranslationInterfacePage.tsx     # Main component to modify
└── ...

backend/src/
├── services/
│   ├── aiSuggestionService.ts       # New AI service
│   └── ...
├── controllers/
│   ├── aiController.ts              # New AI controller
│   └── ...
└── routes/
    ├── aiRoutes.ts                  # New AI routes
    └── ...
```

---

## 🔧 Implementation Details

### Batch 1: UI Cleanup & Basic Fixes

#### 1.1 Remove Title Header
**File**: `frontend/src/pages/TranslationInterfacePage.tsx`

```tsx
// BEFORE (lines 484-506)
<Box sx={{ p: 3, pb: 0 }}>
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Typography variant="h4" component="h1">
      Translation Interface
    </Typography>
    <Box display="flex" gap={2}>
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSegments}>
        Refresh
      </Button>
      <Button variant="outlined" startIcon={<DownloadIcon />} disabled={segments.length === 0}>
        Export
      </Button>
    </Box>
  </Box>
</Box>

// AFTER - Remove entire section
// Move Refresh and Export buttons to filters section
```

#### 1.2 Fix Search Focus Loss
```tsx
// Add useCallback import
import { useCallback } from 'react';

// Create stable search handler
const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
}, []);

// Update TextField
<TextField
  key="search-field"
  fullWidth
  placeholder="Search segments..."
  value={searchTerm}
  onChange={handleSearchChange}
  InputProps={{
    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
  }}
/>
```

#### 1.3 Update Status Icons
```tsx
// Add new icon imports
import {
  FiberNew as FiberNewIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  RateReview as RateReviewIcon,
  Verified as VerifiedIcon,
  Help as HelpIcon
} from '@mui/icons-material';

// Update getStatusIcon function
const getStatusIcon = (status: string) => {
  const iconProps = { fontSize: 'small' as const };
  
  switch (status) {
    case 'new': return <FiberNewIcon {...iconProps} color="success" />;
    case 'in_progress': return <HourglassEmptyIcon {...iconProps} color="warning" />;
    case 'translated': return <CheckCircleIcon {...iconProps} color="info" />;
    case 'reviewed': return <RateReviewIcon {...iconProps} color="secondary" />;
    case 'approved': return <VerifiedIcon {...iconProps} color="success" />;
    default: return <HelpIcon {...iconProps} />;
  }
};
```

#### 1.4 Fix Translator Avatar
```tsx
// Add Avatar import
import { Avatar } from '@mui/material';

// Update translator cell renderer
cellRenderer: (params: any) => {
  const translator = params.data.translator;
  return translator ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {translator.avatarUrl ? (
        <img
          src={translator.avatarUrl}
          alt={translator.name}
          style={{ width: 24, height: 24, borderRadius: '50%' }}
        />
      ) : (
        <Avatar sx={{ width: 24, height: 24, fontSize: '12px', bgcolor: 'primary.main' }}>
          {translator.name?.charAt(0)?.toUpperCase() || '?'}
        </Avatar>
      )}
      <span style={{ 
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {translator.name}
      </span>
    </div>
  ) : '-';
}
```

---

### Batch 2: Functionality Fixes

#### 2.1 Export Functionality
**Dependencies**: Add to `frontend/package.json`
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

**Implementation**:
```tsx
// Add imports
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Export functions
const exportToExcel = (data: Segment[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(segment => ({
    'Segment Key': segment.segmentKey,
    'Source Text': segment.sourceText,
    'Target Text': segment.targetText || '',
    'Status': segment.status,
    'Translator': segment.translator?.name || '',
    'Updated': new Date(segment.updatedAt).toLocaleDateString()
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Segments');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(dataBlob, `translation-segments-${new Date().toISOString().split('T')[0]}.xlsx`);
};

const exportToCSV = (data: Segment[]) => {
  const csvContent = [
    ['Segment Key', 'Source Text', 'Target Text', 'Status', 'Translator', 'Updated'],
    ...data.map(segment => [
      segment.segmentKey,
      segment.sourceText,
      segment.targetText || '',
      segment.status,
      segment.translator?.name || '',
      new Date(segment.updatedAt).toLocaleDateString()
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `translation-segments-${new Date().toISOString().split('T')[0]}.csv`);
};

const exportToJSON = (data: Segment[]) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  saveAs(blob, `translation-segments-${new Date().toISOString().split('T')[0]}.json`);
};

// Update Export button
<Button
  variant="outlined"
  startIcon={<DownloadIcon />}
  disabled={segments.length === 0}
  onClick={() => setExportDialogOpen(true)}
>
  Export
</Button>
```

#### 2.2 Fix Status Filter
```tsx
// Update filteredSegments logic
const filteredSegments = useMemo(() => {
  let filtered = segments;
  
  // Search filter
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(segment =>
      segment.sourceText.toLowerCase().includes(searchLower) ||
      (segment.targetText && segment.targetText.toLowerCase().includes(searchLower)) ||
      segment.segmentKey.toLowerCase().includes(searchLower)
    );
  }
  
  // Status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(segment => segment.status === statusFilter);
  }
  
  return filtered;
}, [segments, searchTerm, statusFilter]);

// Update AgGridReact to use filteredSegments
<AgGridReact
  // ... other props
  rowData={filteredSegments}
/>
```

#### 2.3 Fix Bulk Actions
```tsx
// Update handleBulkUpdate function
const handleBulkUpdate = async (status: string) => {
  if (selectedSegments.length === 0) return;

  try {
    setLoading(true);
    const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/segments/project/${projectId}/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        segmentIds: selectedSegments.map(s => s.id),
        status: status
      })
    });

    if (response.ok) {
      // Refresh segments
      await loadSegments();
      setSelectedSegments([]);
      setSnackbar({
        open: true,
        message: `${selectedSegments.length} segments updated to ${status}`,
        severity: 'success'
      });
    } else {
      throw new Error('Bulk update failed');
    }
  } catch (error) {
    console.error('Bulk update failed:', error);
    setSnackbar({
      open: true,
      message: 'Bulk update failed',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

---

### Batch 3: Grid Enhancements

#### 3.1 Add Gaia Suggestion Column
```tsx
// Add to columnDefs array
{
  headerName: 'Gaia Suggestion',
  field: 'aiSuggestion',
  minWidth: 200,
  flex: 1,
  editable: true,
  cellEditor: 'agLargeTextCellEditor',
  cellEditorParams: {
    maxLength: 2000,
    rows: 4,
  },
  cellRenderer: (params: any) => (
    <div style={{ 
      whiteSpace: 'pre-wrap', 
      wordBreak: 'break-word',
      padding: '8px 0',
      minHeight: '40px',
      lineHeight: '1.4',
      fontStyle: params.value ? 'normal' : 'italic',
      color: params.value ? 'inherit' : '#666',
      backgroundColor: params.value ? '#f0f8ff' : 'transparent',
      borderRadius: '4px',
      padding: '8px'
    }}>
      {params.value || 'No suggestion yet...'}
    </div>
  ),
  cellStyle: (params: any) => ({
    backgroundColor: params.value ? '#f0f8ff' : 'transparent'
  })
}
```

---

### Batch 4: Visual & UX Improvements

#### 4.1 Increase Row Height
```tsx
<AgGridReact
  // ... other props
  rowHeight={80}
  headerHeight={50}
  defaultColDef={{
    resizable: true,
    sortable: true,
    filter: true,
    wrapText: true,
    autoHeight: false,
    singleClickEdit: true,
  }}
/>
```

#### 4.2 Single-Click Editing
```tsx
<AgGridReact
  // ... other props
  singleClickEdit={true}
  stopEditingWhenCellsLoseFocus={true}
  suppressClickEdit={false}
  suppressKeyboardEvent={(params) => {
    // Allow Enter key to start editing
    return params.event.key === 'Enter' ? false : true;
  }}
/>
```

#### 4.3 Row Background Colors
```tsx
// Add getRowStyle function
const getRowStyle = (params: any) => {
  const status = params.data.status;
  const colors = {
    new: '#E3F2FD',           // Light blue
    in_progress: '#FFF3E0',   // Light orange
    translated: '#E8F5E8',    // Light green
    reviewed: '#F3E5F5',      // Light purple
    approved: '#E8F5E8'       // Light green
  };
  return { 
    backgroundColor: colors[status] || 'white',
    borderLeft: `4px solid ${getStatusColor(status)}`
  };
};

// Add to AgGridReact
<AgGridReact
  // ... other props
  getRowStyle={getRowStyle}
/>

// Helper function for status colors
const getStatusColor = (status: string) => {
  const colors = {
    new: '#2196F3',
    in_progress: '#FF9800',
    translated: '#4CAF50',
    reviewed: '#9C27B0',
    approved: '#4CAF50'
  };
  return colors[status] || '#666';
};
```

---

## 🧪 Testing Checklist

### Batch 1 Testing
- [ ] Title header is removed
- [ ] Search bar maintains focus while typing
- [ ] NEW status shows correct icon
- [ ] All statuses show appropriate icons
- [ ] Translator avatars display correctly

### Batch 2 Testing
- [ ] Export to Excel works
- [ ] Export to CSV works
- [ ] Export to JSON works
- [ ] Status filter works correctly
- [ ] Bulk action buttons work
- [ ] Selection state updates properly

### Batch 3 Testing
- [ ] Gaia Suggestion column appears
- [ ] Column is editable
- [ ] Column renders correctly

### Batch 4 Testing
- [ ] Row height is increased
- [ ] Single-click editing works
- [ ] Row colors change based on status
- [ ] Visual improvements are consistent

---

## 🐛 Common Issues & Solutions

### Issue: Search loses focus
**Solution**: Use `useCallback` and add `key` prop to TextField

### Issue: Filter not working
**Solution**: Ensure `filteredSegments` is used in `rowData` prop

### Issue: Export not working
**Solution**: Check if `xlsx` and `file-saver` are properly installed

### Issue: Bulk actions not working
**Solution**: Verify API endpoint and request format

### Issue: Row colors not showing
**Solution**: Ensure `getRowStyle` function is properly defined and referenced

---

## 📝 Code Review Checklist

- [ ] All imports are correct
- [ ] Functions are properly typed
- [ ] Error handling is implemented
- [ ] Loading states are managed
- [ ] User feedback is provided
- [ ] Performance is optimized
- [ ] Code is readable and maintainable

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: Development Team

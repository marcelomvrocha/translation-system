import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  LinearProgress,
  Paper,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  FiberNew as FiberNewIcon,
  HourglassEmpty as HourglassEmptyIcon,
  RateReview as RateReviewIcon,
  Verified as VerifiedIcon,
  Help as HelpIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Code as JsonIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

interface Segment {
  id: string;
  segmentKey: string;
  sourceText: string;
  targetText?: string;
  aiSuggestion?: string;
  status: 'new' | 'in_progress' | 'translated' | 'reviewed' | 'approved';
  translator?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}


const TranslationInterfacePage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Stable search handler to prevent focus loss
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [stats, setStats] = useState<any>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Client-side filtering
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
      const beforeCount = filtered.length;
      filtered = filtered.filter(segment => segment.status === statusFilter);
      console.log(`Status filter "${statusFilter}": ${beforeCount} -> ${filtered.length} segments`);
    }
    
    console.log(`Total filtered segments: ${filtered.length} (from ${segments.length} total)`);
    console.log('Filtered segment statuses:', filtered.map(s => ({ id: s.id, status: s.status, segmentKey: s.segmentKey })));
    return filtered;
  }, [segments, searchTerm, statusFilter]);

  // Load segments
  const loadSegments = useCallback(async () => {
    console.log('loadSegments function called with projectId:', projectId);
    if (!projectId) {
      console.log('loadSegments: No projectId, returning early');
      return;
    }
    
    console.log('loadSegments: Starting to load segments...');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000'
      });

      const token = localStorage.getItem('accessToken');
      console.log('Loading segments for project:', projectId);
      console.log('Using token:', token ? 'Present' : 'Missing');
      console.log('API URL:', `/api/segments/project/${projectId}?${params}`);

      const response = await fetch(`/api/segments/project/${projectId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Segments response:', result);
        console.log('Segments data:', result.data);
        console.log('Segments count:', result.data?.length || 0);
        
        // Debug segment statuses
        if (result.data && result.data.length > 0) {
          console.log('Segment statuses:', result.data.map((s: Segment) => ({ id: s.id, status: s.status, segmentKey: s.segmentKey })));
        }
        
        
        setSegments(result.data || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to load segments:', response.status, errorText);
        setError(`Failed to load segments: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Error loading segments:', err);
      setError('Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Loading stats for project:', projectId);
      console.log('Using token:', token ? 'Present' : 'Missing');

      const response = await fetch(`/api/segments/project/${projectId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Stats response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Stats response:', result);
        setStats(result.data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load stats:', response.status, errorText);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [projectId]);

  useEffect(() => {
    console.log('TranslationInterfacePage: useEffect triggered');
    console.log('Project ID:', projectId);
    console.log('User:', user);
    console.log('loadSegments function:', typeof loadSegments);
    console.log('loadStats function:', typeof loadStats);
    if (projectId) {
      console.log('Calling loadSegments and loadStats...');
      loadSegments();
      loadStats();
    } else {
      console.log('No projectId, not calling loadSegments/loadStats');
    }
  }, [projectId, loadSegments, loadStats]);

  // Add debugging for segments state changes
  useEffect(() => {
    console.log('TranslationInterfacePage: segments state changed');
    console.log('Segments count:', segments.length);
    console.log('Segments data:', segments);
  }, [segments]);

  // Handle window resize for grid responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (gridApi) {
        setTimeout(() => {
          gridApi.sizeColumnsToFit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridApi]);

  // Add debugging for loading state changes
  useEffect(() => {
    console.log('TranslationInterfacePage: loading state changed to:', loading);
  }, [loading]);

  // Add debugging for error state changes
  useEffect(() => {
    console.log('TranslationInterfacePage: error state changed to:', error);
  }, [error]);

  // Grid column definitions
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Key',
      field: 'segmentKey',
      minWidth: 150,
      maxWidth: 250,
      pinned: 'left',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      resizable: true,
      suppressSizeToFit: true,
      cellRenderer: (params: any) => (
        <div style={{ 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '8px 0'
        }}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'Source Text',
      field: 'sourceText',
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: any) => (
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          padding: '8px 0',
          lineHeight: '1.4'
        }}>
          {params.value}
        </div>
      ),
    },
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
          color: params.value ? 'inherit' : '#666'
        }}>
          {params.value || 'No suggestion yet...'}
        </div>
      ),
    },
    {
      headerName: 'Target Text',
      field: 'targetText',
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
          lineHeight: '1.4'
        }}>
          {params.value || ''}
        </div>
      ),
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      cellRenderer: (params: any) => {
        const status = params.value;
        const colors: Record<string, string> = {
          new: 'default',
          in_progress: 'warning',
          translated: 'info',
          reviewed: 'success',
          approved: 'success'
        };
        
        const getStatusIcon = (status: string) => {
          const iconProps = { fontSize: 'small' as const };
          switch (status) {
            case 'new': return <FiberNewIcon {...iconProps} />;
            case 'in_progress': return <HourglassEmptyIcon {...iconProps} />;
            case 'translated': return <CheckIcon {...iconProps} />;
            case 'reviewed': return <RateReviewIcon {...iconProps} />;
            case 'approved': return <VerifiedIcon {...iconProps} />;
            default: return <HelpIcon {...iconProps} />;
          }
        };
        
        return (
          <Chip
            icon={getStatusIcon(status)}
            label={status.replace('_', ' ').toUpperCase()}
            color={colors[status] as any}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      headerName: 'Translator',
      field: 'translator.name',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      cellRenderer: (params: any) => {
        const translator = params.data.translator;
        
        // If no translator assigned, show "Unassigned"
        if (!translator || !translator.name) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '12px', bgcolor: 'grey.300' }}>
                ?
              </Avatar>
              <span style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'grey.600'
              }}>
                Unassigned
              </span>
            </div>
          );
        }
        
        const initials = translator.name.charAt(0).toUpperCase();
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {translator.avatarUrl ? (
              <img
                src={translator.avatarUrl}
                alt={translator.name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
                onError={(e) => {
                  // Hide image and show avatar fallback
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <Avatar 
              sx={{ 
                width: 24, 
                height: 24, 
                fontSize: '12px', 
                bgcolor: 'primary.main',
                display: translator.avatarUrl ? 'none' : 'flex'
              }}
            >
              {initials}
            </Avatar>
            <span style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {translator.name}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Updated',
      field: 'updatedAt',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      cellRenderer: (params: any) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
  ], []);

  // Grid event handlers
  const onGridReady = (params: GridReadyEvent) => {
    console.log('TranslationInterfacePage: AG-Grid ready');
    console.log('Grid API:', params.api);
    console.log('Row Data at grid ready:', segments);
    setGridApi(params.api);
    
    // Auto-size columns on grid ready
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const onSelectionChanged = () => {
    if (gridApi) {
      const selectedRows = gridApi.getSelectedRows();
      console.log('Selection changed:', selectedRows.length, 'rows selected');
      setSelectedSegments(selectedRows);
    }
  };

  const onCellValueChanged = async (params: any) => {
    if (params.colDef.field === 'targetText') {
      try {
        const response = await fetch(`/api/segments/${params.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            targetText: params.newValue
          })
        });

        if (response.ok) {
          setSnackbar({ open: true, message: 'Translation saved', severity: 'success' });
          loadSegments();
        } else {
          setSnackbar({ open: true, message: 'Failed to save translation', severity: 'error' });
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to save translation', severity: 'error' });
      }
    } else if (params.colDef.field === 'aiSuggestion') {
      try {
        const response = await fetch(`/api/segments/${params.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            aiSuggestion: params.newValue
          })
        });

        if (response.ok) {
          setSnackbar({ open: true, message: 'AI suggestion saved', severity: 'success' });
          loadSegments();
        } else {
          setSnackbar({ open: true, message: 'Failed to save AI suggestion', severity: 'error' });
        }
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to save AI suggestion', severity: 'error' });
      }
    }
  };

  // Bulk operations
  const handleBulkUpdate = async (status: string) => {
    console.log('handleBulkUpdate called with status:', status);
    console.log('Selected segments:', selectedSegments.length);
    
    if (selectedSegments.length === 0) {
      console.log('No segments selected, returning early');
      setSnackbar({ open: true, message: 'No segments selected', severity: 'warning' });
      return;
    }

    try {
      console.log('Sending bulk update request...');
      const response = await fetch(`/api/segments/project/${projectId}/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          segments: selectedSegments.map(segment => ({
            id: segment.id,
            status
          }))
        })
      });

      console.log('Bulk update response status:', response.status);
      
      if (response.ok) {
        console.log('Bulk update successful');
        setSnackbar({ open: true, message: `Updated ${selectedSegments.length} segments to ${status}`, severity: 'success' });
        loadSegments();
        loadStats();
      } else {
        const errorText = await response.text();
        console.error('Bulk update failed:', response.status, errorText);
        setSnackbar({ open: true, message: 'Failed to update segments', severity: 'error' });
      }
    } catch (err) {
      console.error('Bulk update error:', err);
      setSnackbar({ open: true, message: 'Failed to update segments', severity: 'error' });
    }
  };

  // Export functions
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const exportToExcel = (data: Segment[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(segment => ({
      'Segment Key': segment.segmentKey,
      'Source Text': segment.sourceText,
      'Gaia Suggestion': segment.aiSuggestion || '',
      'Target Text': segment.targetText || '',
      'Status': segment.status,
      'Translator': segment.translator?.name || 'Unassigned',
      'Reviewer': segment.reviewer?.name || 'Unassigned',
      'Created At': new Date(segment.createdAt).toLocaleDateString(),
      'Updated At': new Date(segment.updatedAt).toLocaleDateString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Translation Segments');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `translation-segments-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = (data: Segment[]) => {
    const csvData = data.map(segment => ({
      'Segment Key': segment.segmentKey,
      'Source Text': segment.sourceText,
      'Gaia Suggestion': segment.aiSuggestion || '',
      'Target Text': segment.targetText || '',
      'Status': segment.status,
      'Translator': segment.translator?.name || 'Unassigned',
      'Reviewer': segment.reviewer?.name || 'Unassigned',
      'Created At': new Date(segment.createdAt).toLocaleDateString(),
      'Updated At': new Date(segment.updatedAt).toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `translation-segments-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToJSON = (data: Segment[]) => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalSegments: data.length,
      segments: data.map(segment => ({
        id: segment.id,
        segmentKey: segment.segmentKey,
        sourceText: segment.sourceText,
        aiSuggestion: segment.aiSuggestion,
        targetText: segment.targetText,
        status: segment.status,
        translator: segment.translator,
        reviewer: segment.reviewer,
        createdAt: segment.createdAt,
        updatedAt: segment.updatedAt
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    saveAs(blob, `translation-segments-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleExport = (format: 'excel' | 'csv' | 'json') => {
    try {
      const dataToExport = filteredSegments.length > 0 ? filteredSegments : segments;
      
      switch (format) {
        case 'excel':
          exportToExcel(dataToExport);
          break;
        case 'csv':
          exportToCSV(dataToExport);
          break;
        case 'json':
          exportToJSON(dataToExport);
          break;
      }
      
      setSnackbar({
        open: true,
        message: `Exported ${dataToExport.length} segments to ${format.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: 'Export failed. Please try again.',
        severity: 'error'
      });
    } finally {
      handleExportMenuClose();
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (status) {
      case 'new': return <FiberNewIcon {...iconProps} color="success" />;
      case 'in_progress': return <HourglassEmptyIcon {...iconProps} color="warning" />;
      case 'translated': return <CheckIcon {...iconProps} color="info" />;
      case 'reviewed': return <RateReviewIcon {...iconProps} color="secondary" />;
      case 'approved': return <VerifiedIcon {...iconProps} color="success" />;
      default: return <HelpIcon {...iconProps} />;
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading segments...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', // Subtract app bar height
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* Header - Removed title, moved buttons to filters section */}

      {/* Statistics */}
      {stats && (
        <Box sx={{ px: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Segments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <Grid item xs={12} sm={6} md={3} key={status}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(status)}
                      <Typography variant="h6">
                        {count as number}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {status.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ px: 3, mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
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
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">
                    <Box display="flex" alignItems="center" gap={1}>
                      <HelpIcon fontSize="small" />
                      All Status
                    </Box>
                  </MenuItem>
                  <MenuItem value="new">
                    <Box display="flex" alignItems="center" gap={1}>
                      <FiberNewIcon fontSize="small" color="success" />
                      New
                    </Box>
                  </MenuItem>
                  <MenuItem value="in_progress">
                    <Box display="flex" alignItems="center" gap={1}>
                      <HourglassEmptyIcon fontSize="small" color="warning" />
                      In Progress
                    </Box>
                  </MenuItem>
                  <MenuItem value="translated">
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckIcon fontSize="small" color="info" />
                      Translated
                    </Box>
                  </MenuItem>
                  <MenuItem value="reviewed">
                    <Box display="flex" alignItems="center" gap={1}>
                      <RateReviewIcon fontSize="small" color="secondary" />
                      Reviewed
                    </Box>
                  </MenuItem>
                  <MenuItem value="approved">
                    <Box display="flex" alignItems="center" gap={1}>
                      <VerifiedIcon fontSize="small" color="success" />
                      Approved
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={5}>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                {selectedSegments.length > 0 && (
                  <Typography variant="body2" color="primary" sx={{ mr: 1 }}>
                    {selectedSegments.length} selected
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkUpdate('translated')}
                  disabled={selectedSegments.length === 0}
                >
                  Mark as Translated
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkUpdate('reviewed')}
                  disabled={selectedSegments.length === 0}
                >
                  Mark as Reviewed
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkUpdate('approved')}
                  disabled={selectedSegments.length === 0}
                >
                  Mark as Approved
                </Button>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadSegments}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    disabled={filteredSegments.length === 0}
                    onClick={handleExportClick}
                  >
                    Export
                  </Button>
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={handleExportMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <MenuItem onClick={() => handleExport('excel')}>
                      <ListItemIcon>
                        <ExcelIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Export to Excel</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleExport('csv')}>
                      <ListItemIcon>
                        <CsvIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Export to CSV</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleExport('json')}>
                      <ListItemIcon>
                        <JsonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Export to JSON</ListItemText>
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Translation Grid */}
      <Paper sx={{ 
        flex: 1,
        minHeight: '400px',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div
          className="ag-theme-alpine"
          style={{ 
            height: '100%', 
            width: '100%',
            flex: 1,
            minHeight: 0,
            '--ag-header-height': '50px',
            '--ag-row-height': '60px',
            '--ag-font-size': '14px',
            '--ag-font-family': 'Roboto, sans-serif'
          } as React.CSSProperties}
        >
          <AgGridReact
            columnDefs={columnDefs}
            rowData={filteredSegments}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            animateRows={true}
            onFirstDataRendered={(params) => {
              console.log('TranslationInterfacePage: AG-Grid first data rendered');
              console.log('Row count:', params.api.getDisplayedRowCount());
              console.log('Row data:', segments);
              // Auto-size columns on first render
              params.api.sizeColumnsToFit();
            }}
            onModelUpdated={(params) => {
              console.log('TranslationInterfacePage: AG-Grid model updated');
              console.log('Row count:', params.api.getDisplayedRowCount());
            }}
            onGridSizeChanged={(params) => {
              // Auto-size columns when grid size changes
              params.api.sizeColumnsToFit();
            }}
            defaultColDef={{
              resizable: true,
              sortable: true,
              filter: true,
              wrapText: true,
              autoHeight: false,
            }}
            getRowId={(params) => params.data.id}
            suppressHorizontalScroll={false}
            suppressColumnVirtualisation={true}
            rowHeight={60}
            headerHeight={50}
          />
        </div>
      </Paper>

      {/* Selection Info */}
      {selectedSegments.length > 0 && (
        <Box sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedSegments.length} segment(s) selected
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as 'success' | 'error' | 'warning'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TranslationInterfacePage;

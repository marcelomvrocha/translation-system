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
  Avatar
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
  Help as HelpIcon
} from '@mui/icons-material';
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [stats, setStats] = useState<any>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

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
        limit: '1000',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const token = localStorage.getItem('accessToken');
      console.log('Loading segments for project:', projectId);
      console.log('Using token:', token ? 'Present' : 'Missing');
      console.log('API URL:', `${(import.meta as any).env.VITE_API_URL}/segments/project/${projectId}?${params}`);

      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/segments/project/${projectId}?${params}`, {
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
  }, [projectId, searchTerm, statusFilter]);

  // Load statistics
  const loadStats = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Loading stats for project:', projectId);
      console.log('Using token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/segments/project/${projectId}/stats`, {
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
        return (
          <Chip
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
      setSelectedSegments(selectedRows);
    }
  };

  const onCellValueChanged = async (params: any) => {
    if (params.colDef.field === 'targetText') {
      try {
        const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/segments/${params.data.id}`, {
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
    }
  };

  // Bulk operations
  const handleBulkUpdate = async (status: string) => {
    if (selectedSegments.length === 0) return;

    try {
      const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/segments/project/${projectId}/bulk`, {
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

      if (response.ok) {
        setSnackbar({ open: true, message: 'Segments updated successfully', severity: 'success' });
        loadSegments();
        loadStats();
      } else {
        setSnackbar({ open: true, message: 'Failed to update segments', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update segments', severity: 'error' });
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
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="translated">Translated</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={5}>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
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
                    disabled={segments.length === 0}
                  >
                    Export
                  </Button>
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
            rowData={segments}
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
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TranslationInterfacePage;

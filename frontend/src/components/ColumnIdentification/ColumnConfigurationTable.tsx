import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { ColumnInfo, ColumnConfiguration, ColumnMapping, ColumnType } from '@/types/columnIdentification';

interface ColumnConfigurationTableProps {
  columns: ColumnInfo[];
  configuration: ColumnConfiguration | null;
  onConfigurationChange: (config: ColumnConfiguration) => void;
}

const COLUMN_TYPES: { value: ColumnType; label: string; description: string; color: string }[] = [
  { value: 'source', label: 'Source Text', description: 'Original text to be translated', color: 'primary' },
  { value: 'target', label: 'Target Text', description: 'Translated text', color: 'secondary' },
  { value: 'context', label: 'Context', description: 'Additional context information', color: 'success' },
  { value: 'notes', label: 'Notes', description: 'Translator notes or comments', color: 'warning' },
  { value: 'status', label: 'Status', description: 'Translation status', color: 'error' },
  { value: 'key', label: 'Key/ID', description: 'Unique identifier', color: 'default' },
  { value: 'skip', label: 'Skip', description: 'Ignore this column', color: 'default' }
];

const LANGUAGE_CODES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' }
];

const ColumnConfigurationTable: React.FC<ColumnConfigurationTableProps> = ({
  columns,
  configuration,
  onConfigurationChange
}) => {
  const mappings = configuration?.mappings || [];

  const updateMapping = (index: number, field: keyof ColumnMapping, value: any) => {
    if (!configuration) return;

    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    
    onConfigurationChange({
      ...configuration,
      mappings: newMappings
    });
  };

  const removeMapping = (index: number) => {
    if (!configuration) return;

    const newMappings = mappings.filter((_, i) => i !== index);
    onConfigurationChange({
      ...configuration,
      mappings: newMappings
    });
  };

  const addMapping = (column: ColumnInfo) => {
    if (!configuration) return;

    const newMapping: ColumnMapping = {
      columnIndex: column.index,
      columnName: column.name,
      columnType: column.suggestedType,
      languageCode: column.suggestedType === 'source' ? 'en' : 
                   column.suggestedType === 'target' ? 'es' : undefined,
      isRequired: column.suggestedType === 'source' || column.suggestedType === 'target'
    };

    onConfigurationChange({
      ...configuration,
      mappings: [...mappings, newMapping]
    });
  };

  const getColumnTypeInfo = (type: ColumnType) => {
    return COLUMN_TYPES.find(t => t.value === type) || COLUMN_TYPES[0];
  };

  const isColumnMapped = (columnIndex: number) => {
    return mappings.some(mapping => mapping.columnIndex === columnIndex);
  };

  const getUnmappedColumns = () => {
    return columns.filter(column => !isColumnMapped(column.index));
  };

  return (
    <Box>
      {mappings.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No columns configured yet. Add columns from the list below to start mapping.
        </Alert>
      )}

      {mappings.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Language</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Required</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.map((mapping, index) => {
                const column = columns.find(c => c.index === mapping.columnIndex);
                const typeInfo = getColumnTypeInfo(mapping.columnType);
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DragIcon color="action" />
                        <Box>
                          <Typography variant="subtitle2">
                            {mapping.columnName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Column {mapping.columnIndex + 1}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={mapping.columnType}
                          onChange={(e) => updateMapping(index, 'columnType', e.target.value)}
                        >
                          {COLUMN_TYPES.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={type.label}
                                  color={type.color as any}
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    
                    <TableCell>
                      {(mapping.columnType === 'source' || mapping.columnType === 'target') ? (
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={mapping.languageCode || ''}
                            onChange={(e) => updateMapping(index, 'languageCode', e.target.value)}
                          >
                            {LANGUAGE_CODES.map(lang => (
                              <MenuItem key={lang.code} value={lang.code}>
                                {lang.name} ({lang.code})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={mapping.isRequired}
                            onChange={(e) => updateMapping(index, 'isRequired', e.target.checked)}
                            size="small"
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title="Remove mapping">
                        <IconButton
                          size="small"
                          onClick={() => removeMapping(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {getUnmappedColumns().length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Available Columns
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Click on a column to add it to your configuration.
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            {getUnmappedColumns().map((column) => (
              <Tooltip
                key={column.index}
                title={`${column.name} - Suggested: ${column.suggestedType} (${Math.round(column.confidence * 100)}% confidence)`}
              >
                <Chip
                  label={`${column.name} (${column.suggestedType})`}
                  color="default"
                  variant="outlined"
                  clickable
                  onClick={() => addMapping(column)}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {mappings.length > 0 && (
        <Box mt={2}>
          <Alert severity="success">
            Configuration ready! {mappings.length} column(s) mapped. 
            {mappings.filter(m => m.isRequired).length > 0 && 
              ` ${mappings.filter(m => m.isRequired).length} required column(s).`
            }
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ColumnConfigurationTable;

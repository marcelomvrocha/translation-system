import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import { ColumnInfo } from '@/types/columnIdentification';

interface ColumnPreviewProps {
  columns: ColumnInfo[];
  previewData: any[][];
  fileName: string;
  sheetName: string;
}

const ColumnPreview: React.FC<ColumnPreviewProps> = ({
  columns,
  previewData,
  fileName,
  sheetName
}) => {
  const getColumnTypeColor = (type: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      source: 'primary',
      target: 'secondary',
      context: 'success',
      notes: 'warning',
      status: 'error',
      key: 'default',
      skip: 'default'
    };
    return colors[type] || 'default';
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  if (columns.length === 0) {
    return (
      <Alert severity="info">
        No columns detected in this file. Please check the file format and try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Detected Columns ({columns.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {columns.map((column, index) => (
            <Tooltip
              key={index}
              title={`${column.name} - ${column.dataType} (${formatConfidence(column.confidence)} confidence)`}
            >
              <Chip
                label={`${column.name} (${column.suggestedType})`}
                color={getColumnTypeColor(column.suggestedType)}
                size="small"
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Data Preview
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Showing first 5 rows of data from {fileName} • {sheetName}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                Row
              </TableCell>
              {columns.map((column, index) => (
                <TableCell
                  key={index}
                  sx={{ 
                    fontWeight: 'bold', 
                    backgroundColor: 'grey.100',
                    minWidth: 150
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {column.name}
                    </Typography>
                    <Box display="flex" gap={0.5} mt={0.5}>
                      <Chip
                        label={column.suggestedType}
                        color={getColumnTypeColor(column.suggestedType)}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      <Chip
                        label={`${Math.round(column.confidence * 100)}%`}
                        variant="outlined"
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.slice(0, 5).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'grey.50' }}>
                  {rowIndex + 1}
                </TableCell>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    <Box
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={String(row[column.index] || '')}
                    >
                      {String(row[column.index] || '')}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2}>
        <Typography variant="body2" color="text.secondary">
          Total rows: {previewData.length} • Columns: {columns.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default ColumnPreview;

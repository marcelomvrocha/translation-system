import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import ColumnPreview from './ColumnPreview';
import ColumnConfigurationTable from './ColumnConfigurationTable';
import PresetSelector from './PresetSelector';
import { ColumnInfo, ColumnConfiguration, ColumnPreset } from '@/types/columnIdentification';

interface ColumnIdentificationDialogProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  fileType: string;
  projectId: string;
  onConfigurationComplete: (config: ColumnConfiguration) => void;
}

const steps = ['Detect Columns', 'Configure Mapping', 'Review & Parse'];

const ColumnIdentificationDialog: React.FC<ColumnIdentificationDialogProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  fileType,
  projectId,
  onConfigurationComplete
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [configuration, setConfiguration] = useState<ColumnConfiguration | null>(null);
  const [presets, setPresets] = useState<ColumnPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string>('');

  // Load presets on mount
  useEffect(() => {
    if (open) {
      loadPresets();
    }
  }, [open]);

  // Detect columns when dialog opens
  useEffect(() => {
    if (open && fileId) {
      detectColumns();
    }
  }, [open, fileId]);

  const loadPresets = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/column-identification/presets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setPresets(result.data);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const detectColumns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/column-identification/files/${fileId}/columns?maxSampleRows=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setColumns(result.data.columns);
        setPreviewData(result.data.previewData);
        setSheetName(result.data.sheetName);
        
        // Auto-advance to configuration step
        setActiveStep(1);
      } else {
        setError(result.error || 'Failed to detect columns');
      }
    } catch (error) {
      setError('Failed to detect columns');
      console.error('Error detecting columns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: ColumnPreset) => {
    const mappings = preset.mappings.map((mapping, index) => ({
      ...mapping,
      columnIndex: index < columns.length ? columns[index].index : index,
      columnName: index < columns.length ? columns[index].name : mapping.columnName
    }));

    setConfiguration({
      name: preset.name,
      description: preset.description,
      fileId,
      sheetName,
      mappings
    });
  };

  const handleConfigurationChange = (newConfiguration: ColumnConfiguration) => {
    setConfiguration(newConfiguration);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleParse = async () => {
    if (!configuration) return;

    setLoading(true);
    setError(null);

    try {
      // Save configuration
      const saveResponse = await fetch(`${import.meta.env.VITE_API_URL}/column-identification/projects/${projectId}/files/${fileId}/column-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(configuration)
      });

      const saveResult = await saveResponse.json();
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save configuration');
      }

      // Parse with configuration
      const parseResponse = await fetch(`${import.meta.env.VITE_API_URL}/column-identification/projects/${projectId}/files/${fileId}/parse-with-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          configurationId: saveResult.data.id
        })
      });

      const parseResult = await parseResponse.json();
      
      if (parseResult.success) {
        onConfigurationComplete(configuration);
        onClose();
      } else {
        throw new Error(parseResult.error || 'Failed to parse file');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Column Detection</Typography>
              <Box>
                <Tooltip title="Refresh Detection">
                  <IconButton onClick={detectColumns} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <ColumnPreview
                columns={columns}
                previewData={previewData}
                fileName={fileName}
                sheetName={sheetName}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Column Configuration</Typography>
              <PresetSelector
                presets={presets}
                onPresetSelect={handlePresetSelect}
                disabled={loading}
              />
            </Box>
            
            <ColumnConfigurationTable
              columns={columns}
              configuration={configuration}
              onConfigurationChange={handleConfigurationChange}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review & Parse</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review your column configuration and parse the file to create translation segments.
            </Typography>
            
            {configuration && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Configuration Summary:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {configuration.mappings.map((mapping, index) => (
                    <Chip
                      key={index}
                      label={`${mapping.columnName} → ${mapping.columnType}${mapping.languageCode ? ` (${mapping.languageCode})` : ''}`}
                      color={mapping.isRequired ? 'primary' : 'default'}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Column Identification</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {fileName} • {fileType}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleBack} disabled={activeStep === 0 || loading}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleParse}
            variant="contained"
            disabled={!configuration || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SettingsIcon />}
          >
            {loading ? 'Parsing...' : 'Parse File'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={activeStep === 0 && columns.length === 0}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ColumnIdentificationDialog;

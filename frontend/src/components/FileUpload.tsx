import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface FileUploadProps {
  projectId: string;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadedFile?: any;
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 100,
  acceptedTypes = [
    'text/plain',
    'application/json',
    'application/xml',
    'text/xml',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.apple.numbers',
    'application/zip',
    'application/x-iwork-numbers',
    'application/octet-stream'
  ]
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    // Check both MIME type and file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.txt', '.json', '.xml', '.csv', '.pdf', '.xlsx', '.xls', '.docx', '.odt', '.numbers'];
    const isAllowedMimeType = acceptedTypes.includes(file.type);
    const isAllowedExtension = allowedExtensions.includes(fileExtension);
    
    if (!isAllowedMimeType && !isAllowedExtension) {
      console.log('File rejected by frontend:', { 
        filename: file.name, 
        mimetype: file.type, 
        extension: fileExtension 
      });
      return 'File type not supported';
    }
    
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Debug logging for file detection
      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      const error = validateFile(file);
      if (error) {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'error',
          progress: 0,
          error
        });
      } else {
        newFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
          progress: 0
        });
      }
    });

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);

    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const response = await fetch(`/api/files/upload/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'success', 
              progress: 100, 
              uploadedFile: result.data 
            }
          : f
      ));

      onUploadComplete?.([result.data]);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ));
    }
  };

  const handleUploadAll = () => {
    files
      .filter(f => f.status === 'pending')
      .forEach(uploadFile);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'uploading':
        return 'primary';
      default:
        return 'default';
    }
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          textAlign: 'center',
          border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: isDragOver ? '#f5f5f5' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          console.log('File upload area clicked');
          console.log('File input ref:', fileInputRef.current);
          fileInputRef.current?.click();
        }}
      >
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Supported formats: TXT, JSON, XML, PDF, CSV, Excel, Numbers
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Max {maxFiles} files, {maxSize}MB each
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          style={{ display: 'none' }}
          onChange={(e) => {
            console.log('File input changed:', e.target.files);
            handleFileSelect(e.target.files);
          }}
        />
      </Paper>

      {files.length > 0 && (
        <Box mt={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Files ({files.length})
            </Typography>
            {pendingFiles.length > 0 && (
              <Button
                variant="contained"
                onClick={handleUploadAll}
                disabled={hasErrors}
              >
                Upload All
              </Button>
            )}
          </Box>

          <List>
            {files.map((file) => (
              <ListItem key={file.id} divider>
                <ListItemText
                  primary={file.file.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {formatFileSize(file.file.size)}
                      </Typography>
                      {file.status === 'uploading' && (
                        <LinearProgress 
                          variant="determinate" 
                          value={file.progress} 
                          sx={{ mt: 1 }}
                        />
                      )}
                      {file.error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {file.error}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(file.status)}
                    <Chip
                      label={file.status}
                      size="small"
                      color={getStatusColor(file.status) as any}
                      variant="outlined"
                    />
                    <IconButton
                      edge="end"
                      onClick={() => removeFile(file.id)}
                      disabled={file.status === 'uploading'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;

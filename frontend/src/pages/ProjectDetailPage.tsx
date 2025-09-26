import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  Language as LanguageIcon,
  Upload as UploadIcon,
  Folder as FolderIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { getProjectById, updateProject, deleteProject } from '@/store/slices/projectSlice';
import FileUpload from '@/components/FileUpload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectDetailPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, loading, error } = useAppSelector((state) => state.project);
  const { user } = useAppSelector((state) => state.auth);

  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceLanguage: 'en',
    targetLanguage: 'fr'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [parsingFiles, setParsingFiles] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectById(projectId));
      loadFiles();
    }
  }, [projectId, dispatch]);

  const loadFiles = async () => {
    if (!projectId) return;
    
    setLoadingFiles(true);
    try {
      const response = await fetch(`/api/files/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setFiles(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleEditProject = () => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        sourceLanguage: currentProject.sourceLanguage,
        targetLanguage: currentProject.targetLanguage
      });
      setEditDialog(true);
    }
  };

  const handleUpdateProject = async () => {
    if (!currentProject) return;

    try {
      await dispatch(updateProject({ id: currentProject.id, ...formData })).unwrap();
      setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
      setEditDialog(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update project', severity: 'error' });
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;

    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await dispatch(deleteProject(currentProject.id)).unwrap();
        setSnackbar({ open: true, message: 'Project deleted successfully', severity: 'success' });
        navigate('/projects');
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete project', severity: 'error' });
      }
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to download file', severity: 'error' });
    }
  };

  const handleParseFiles = async () => {
    if (!projectId) return;
    
    setParsingFiles(true);
    try {
      const response = await fetch(`/api/files/parse/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({ 
          open: true, 
          message: `Parsed ${result.data.parsed} segments from files! Click "Translate" to view them.`, 
          severity: 'success' 
        });
        // Refresh the files list to show updated content
        fetchProjectFiles(projectId);
      } else {
        setSnackbar({ open: true, message: 'Failed to parse files', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to parse files', severity: 'error' });
    } finally {
      setParsingFiles(false);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'primary';
      case 'translator': return 'secondary';
      case 'reviewer': return 'warning';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (error || !currentProject) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/projects')}
          sx={{ textDecoration: 'none' }}
        >
          Projects
        </Link>
        <Typography color="text.primary">{currentProject.name}</Typography>
      </Breadcrumbs>

      {/* Project Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {currentProject.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {currentProject.description || 'No description provided'}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                startIcon={<TranslateIcon />}
                onClick={() => navigate(`/projects/${currentProject.id}/translate`)}
                sx={{ mr: 1 }}
              >
                Translate
              </Button>
              <IconButton onClick={handleEditProject} sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={handleDeleteProject} color="error">
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <LanguageIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Source Language
                  </Typography>
                  <Typography variant="body1">
                    {getLanguageName(currentProject.sourceLanguage)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <LanguageIcon color="secondary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Target Language
                  </Typography>
                  <Typography variant="body1">
                    {getLanguageName(currentProject.targetLanguage)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Collaborators
                  </Typography>
                  <Typography variant="body1">
                    {currentProject.collaborators?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <FolderIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Files
                  </Typography>
                  <Typography variant="body1">
                    {files.length}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Files" />
            <Tab label="Collaborators" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Project Overview
          </Typography>
          <Typography variant="body1" paragraph>
            This project is translating content from {getLanguageName(currentProject.sourceLanguage)} to {getLanguageName(currentProject.targetLanguage)}.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Created: {new Date(currentProject.createdAt).toLocaleDateString()}
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Project Files
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setTabValue(1)}
              >
                Upload Files
              </Button>
              <Button
                variant="contained"
                startIcon={<TranslateIcon />}
                onClick={handleParseFiles}
                disabled={parsingFiles || files.length === 0}
              >
                {parsingFiles ? 'Parsing...' : 'Parse Files'}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<TranslateIcon />}
                onClick={() => navigate(`/projects/${projectId}/translate`)}
              >
                View Segments
              </Button>
            </Box>
          </Box>

          <FileUpload
            projectId={projectId!}
            onUploadComplete={async (uploadedFiles) => {
              if (Array.isArray(uploadedFiles)) {
                setFiles(prev => [...prev, ...uploadedFiles]);
                setSnackbar({ open: true, message: 'Files uploaded successfully', severity: 'success' });
                
                // Automatically parse the uploaded files
                try {
                  setParsingFiles(true);
                  const response = await fetch(`/api/files/parse/${projectId}`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    setSnackbar({ 
                      open: true, 
                      message: `Files uploaded and parsed successfully! ${result.data.parsed} segments created.`, 
                      severity: 'success' 
                    });
                    // Refresh the files list to show updated content
                    fetchProjectFiles(projectId!);
                  } else {
                    setSnackbar({ 
                      open: true, 
                      message: 'Files uploaded but parsing failed. You can parse them manually.', 
                      severity: 'warning' 
                    });
                  }
                } catch (error) {
                  console.error('Error parsing files:', error);
                  setSnackbar({ 
                    open: true, 
                    message: 'Files uploaded but parsing failed. You can parse them manually.', 
                    severity: 'warning' 
                  });
                } finally {
                  setParsingFiles(false);
                }
              }
            }}
          />

          {files.length > 0 && (
            <Box mt={3}>
              <List>
                {files.map((file) => (
                  <ListItem key={file.id} divider>
                    <ListItemText
                      primary={file.originalFilename}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {formatFileSize(file.fileSize)} • {file.fileType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded by {file.uploader.name} on {new Date(file.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDownloadFile(file.id, file.originalFilename)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Collaborators
          </Typography>
          <List>
            {currentProject.collaborators?.map((collaborator) => (
              <ListItem key={collaborator.id} divider>
                <ListItemText
                  primary={collaborator.user.name}
                  secondary={collaborator.user.email}
                />
                <Chip
                  label={collaborator.role}
                  color={getRoleColor(collaborator.role) as any}
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Card>

      {/* Edit Project Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box display="flex" gap={2}>
            <TextField
              select
              margin="dense"
              label="Source Language"
              fullWidth
              variant="outlined"
              value={formData.sourceLanguage}
              onChange={(e) => setFormData({ ...formData, sourceLanguage: e.target.value })}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              margin="dense"
              label="Target Language"
              fullWidth
              variant="outlined"
              value={formData.targetLanguage}
              onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value })}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateProject} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default ProjectDetailPage;

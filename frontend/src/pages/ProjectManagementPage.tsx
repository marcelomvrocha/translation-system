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
  Fab,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  FileUpload as FileUploadIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { getProjects, createProject, updateProject, deleteProject } from '@/store/slices/projectSlice';
import { Project } from '@/types';

const ProjectManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector((state) => state.project);
  const { user } = useAppSelector((state) => state.auth);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceLanguage: 'en',
    targetLanguage: 'fr'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
    dispatch(getProjects());
  }, [dispatch]);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        sourceLanguage: project.sourceLanguage,
        targetLanguage: project.targetLanguage
      });
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        sourceLanguage: 'en',
        targetLanguage: 'fr'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      sourceLanguage: 'en',
      targetLanguage: 'fr'
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingProject) {
        await dispatch(updateProject({ id: editingProject.id, ...formData })).unwrap();
        setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
      } else {
        await dispatch(createProject(formData)).unwrap();
        setSnackbar({ open: true, message: 'Project created successfully', severity: 'success' });
      }
      handleCloseDialog();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save project', severity: 'error' });
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
        setSnackbar({ open: true, message: 'Project deleted successfully', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete project', severity: 'error' });
      }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Project Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" noWrap>
                    {project.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(project)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(project.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {project.description || 'No description provided'}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LanguageIcon fontSize="small" />
                  <Typography variant="body2">
                    {getLanguageName(project.sourceLanguage)} → {getLanguageName(project.targetLanguage)}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PeopleIcon fontSize="small" />
                  <Typography variant="body2">
                    {project.collaborators?.length || 0} collaborators
                  </Typography>
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {project.collaborators?.map((collaborator) => (
                    <Chip
                      key={collaborator.id}
                      label={collaborator.user.name}
                      size="small"
                      color={getRoleColor(collaborator.role) as any}
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Project
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileUploadIcon />}
                  fullWidth
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  Upload Files
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projects.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first translation project to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Project
          </Button>
        </Box>
      )}

      {/* Create/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Update' : 'Create'}
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

export default ProjectManagementPage;

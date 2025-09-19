import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Translate as TranslateIcon,
  Memory as MemoryIcon,
  Book as BookIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { getProjectById } from '@/store/slices/projectSlice';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentProject, isLoading, error } = useAppSelector((state) => state.project);

  useEffect(() => {
    if (id) {
      dispatch(getProjectById(id));
    }
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!currentProject) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Project not found
      </Alert>
    );
  }

  return (
    <Box>
      {/* Project Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentProject.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {currentProject.description || 'No description provided'}
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={`${currentProject.sourceLanguage.toUpperCase()} → ${currentProject.targetLanguage.toUpperCase()}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${currentProject._count?.segments || 0} segments`}
            color="secondary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Project Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TranslateIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{currentProject._count?.segments || 0}</Typography>
                  <Typography color="text.secondary">Segments</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MemoryIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{currentProject._count?.translationMemory || 0}</Typography>
                  <Typography color="text.secondary">TM Entries</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BookIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{currentProject._count?.glossaries || 0}</Typography>
                  <Typography color="text.secondary">Glossary Terms</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{currentProject._count?.collaborators || 0}</Typography>
                  <Typography color="text.secondary">Collaborators</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Project Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Translation Grid
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This is where the translation grid will be implemented in Phase 2.
        </Typography>
        <Alert severity="info">
          Translation grid functionality will be available in Phase 2 of development.
        </Alert>
      </Box>

      {/* Collaborators */}
      {currentProject.collaborators && currentProject.collaborators.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Team Members
          </Typography>
          <Grid container spacing={2}>
            {currentProject.collaborators.map((collaborator) => (
              <Grid item xs={12} sm={6} md={4} key={collaborator.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h6" noWrap>
                        {collaborator.user.name}
                      </Typography>
                      <Chip
                        label={collaborator.role}
                        size="small"
                        color={collaborator.role === 'owner' ? 'primary' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {collaborator.user.email}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ProjectPage;

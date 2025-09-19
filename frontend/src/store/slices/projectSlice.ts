import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProjectService } from '@/services/projectService';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectCollaborator,
  CreateCollaboratorRequest,
  PaginatedResponse,
  ProjectState 
} from '@/types';

// Initial state
const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const getProjects = createAsyncThunk(
  'project/getProjects',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await ProjectService.getProjects(
        params.page || 1,
        params.limit || 10,
        params.search
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

export const getProjectById = createAsyncThunk(
  'project/getProjectById',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const project = await ProjectService.getProjectById(projectId);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData: CreateProjectRequest, { rejectWithValue }) => {
    try {
      const project = await ProjectService.createProject(projectData);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async (params: { projectId: string; projectData: UpdateProjectRequest }, { rejectWithValue }) => {
    try {
      const project = await ProjectService.updateProject(params.projectId, params.projectData);
      return project;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await ProjectService.deleteProject(projectId);
      return projectId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete project');
    }
  }
);

export const getCollaborators = createAsyncThunk(
  'project/getCollaborators',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const collaborators = await ProjectService.getCollaborators(projectId);
      return { projectId, collaborators };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch collaborators');
    }
  }
);

export const addCollaborator = createAsyncThunk(
  'project/addCollaborator',
  async (params: { projectId: string; collaboratorData: CreateCollaboratorRequest }, { rejectWithValue }) => {
    try {
      const collaborator = await ProjectService.addCollaborator(params.projectId, params.collaboratorData);
      return { projectId: params.projectId, collaborator };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add collaborator');
    }
  }
);

export const updateCollaboratorRole = createAsyncThunk(
  'project/updateCollaboratorRole',
  async (params: { projectId: string; collaboratorId: string; role: string }, { rejectWithValue }) => {
    try {
      const collaborator = await ProjectService.updateCollaboratorRole(
        params.projectId,
        params.collaboratorId,
        params.role
      );
      return { projectId: params.projectId, collaborator };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update collaborator role');
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  'project/removeCollaborator',
  async (params: { projectId: string; collaboratorId: string }, { rejectWithValue }) => {
    try {
      await ProjectService.removeCollaborator(params.projectId, params.collaboratorId);
      return { projectId: params.projectId, collaboratorId: params.collaboratorId };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove collaborator');
    }
  }
);

// Project slice
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    // Get projects
    builder
      .addCase(getProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data;
      })
      .addCase(getProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get project by ID
    builder
      .addCase(getProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(getProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create project
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update project
    builder
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get collaborators
    builder
      .addCase(getCollaborators.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCollaborators.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.collaborators = action.payload.collaborators;
        }
      })
      .addCase(getCollaborators.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add collaborator
    builder
      .addCase(addCollaborator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCollaborator.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.collaborators?.push(action.payload.collaborator);
        }
      })
      .addCase(addCollaborator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update collaborator role
    builder
      .addCase(updateCollaboratorRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCollaboratorRole.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProject?.id === action.payload.projectId) {
          const index = state.currentProject.collaborators?.findIndex(
            c => c.id === action.payload.collaborator.id
          );
          if (index !== undefined && index !== -1 && state.currentProject.collaborators) {
            state.currentProject.collaborators[index] = action.payload.collaborator;
          }
        }
      })
      .addCase(updateCollaboratorRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove collaborator
    builder
      .addCase(removeCollaborator.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProject?.id === action.payload.projectId) {
          state.currentProject.collaborators = state.currentProject.collaborators?.filter(
            c => c.id !== action.payload.collaboratorId
          );
        }
      })
      .addCase(removeCollaborator.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentProject, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;

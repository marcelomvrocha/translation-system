import apiService from './api';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectCollaborator,
  CreateCollaboratorRequest,
  PaginatedResponse,
  ApiResponse 
} from '@/types';

export class ProjectService {
  static async getProjects(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response: PaginatedResponse<Project> = await apiService.get(`/projects?${params}`);
    return response;
  }

  static async getProjectById(projectId: string): Promise<Project> {
    const response: ApiResponse<Project> = await apiService.get(`/projects/${projectId}`);
    return response.data!;
  }

  static async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response: ApiResponse<Project> = await apiService.post('/projects', projectData);
    return response.data!;
  }

  static async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<Project> {
    const response: ApiResponse<Project> = await apiService.put(`/projects/${projectId}`, projectData);
    return response.data!;
  }

  static async deleteProject(projectId: string): Promise<void> {
    await apiService.delete(`/projects/${projectId}`);
  }

  static async getCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    const response: ApiResponse<ProjectCollaborator[]> = await apiService.get(`/projects/${projectId}/collaborators`);
    return response.data!;
  }

  static async addCollaborator(projectId: string, collaboratorData: CreateCollaboratorRequest): Promise<ProjectCollaborator> {
    const response: ApiResponse<ProjectCollaborator> = await apiService.post(
      `/projects/${projectId}/collaborators`, 
      collaboratorData
    );
    return response.data!;
  }

  static async updateCollaboratorRole(
    projectId: string, 
    collaboratorId: string, 
    role: string
  ): Promise<ProjectCollaborator> {
    const response: ApiResponse<ProjectCollaborator> = await apiService.put(
      `/projects/${projectId}/collaborators/${collaboratorId}`,
      { role }
    );
    return response.data!;
  }

  static async removeCollaborator(projectId: string, collaboratorId: string): Promise<void> {
    await apiService.delete(`/projects/${projectId}/collaborators/${collaboratorId}`);
  }
}

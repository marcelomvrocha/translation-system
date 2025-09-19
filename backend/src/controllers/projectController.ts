import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '@/services/projectService';
import { handleAsync } from '@/utils/errorHandler';
import { ApiResponse } from '@/types';

export class ProjectController {
  static createProject = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const project = await ProjectService.createProject(userId, req.body);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };

    res.status(201).json(response);
  });

  static getProjects = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const result = await ProjectService.getProjects(userId, {
      page,
      limit,
      search,
    });

    res.status(200).json(result);
  });

  static getProjectById = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const project = await ProjectService.getProjectById(projectId, userId);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project retrieved successfully',
    };

    res.status(200).json(response);
  });

  static updateProject = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const project = await ProjectService.updateProject(projectId, userId, req.body);

    const response: ApiResponse = {
      success: true,
      data: project,
      message: 'Project updated successfully',
    };

    res.status(200).json(response);
  });

  static deleteProject = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    await ProjectService.deleteProject(projectId, userId);

    const response: ApiResponse = {
      success: true,
      message: 'Project deleted successfully',
    };

    res.status(200).json(response);
  });

  static addCollaborator = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const { email, role } = req.body;

    const collaboration = await ProjectService.addCollaborator(projectId, userId, email, role);

    const response: ApiResponse = {
      success: true,
      data: collaboration,
      message: 'Collaborator added successfully',
    };

    res.status(201).json(response);
  });

  static removeCollaborator = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const collaboratorId = req.params.collaboratorId;

    await ProjectService.removeCollaborator(projectId, userId, collaboratorId);

    const response: ApiResponse = {
      success: true,
      message: 'Collaborator removed successfully',
    };

    res.status(200).json(response);
  });

  static updateCollaboratorRole = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;
    const collaboratorId = req.params.collaboratorId;
    const { role } = req.body;

    const collaboration = await ProjectService.updateCollaboratorRole(
      projectId, 
      userId, 
      collaboratorId, 
      role
    );

    const response: ApiResponse = {
      success: true,
      data: collaboration,
      message: 'Collaborator role updated successfully',
    };

    res.status(200).json(response);
  });

  static getCollaborators = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const projectId = req.params.id;

    // First verify access to project
    const project = await ProjectService.getProjectById(projectId, userId);

    const response: ApiResponse = {
      success: true,
      data: project.collaborators,
      message: 'Collaborators retrieved successfully',
    };

    res.status(200).json(response);
  });
}

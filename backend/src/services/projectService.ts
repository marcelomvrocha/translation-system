import { PrismaClient } from '@prisma/client';
import { createError } from '@/utils/errorHandler';
import { 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  Project, 
  ProjectCollaborator,
  PaginationOptions,
  FilterOptions,
  PaginatedResponse
} from '@/types';

const prisma = new PrismaClient();

export class ProjectService {
  static async createProject(userId: string, data: CreateProjectRequest): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Add owner as collaborator
    await prisma.projectCollaborator.create({
      data: {
        projectId: project.id,
        userId: project.ownerId,
        role: 'owner',
      }
    });

    return project;
  }

  static async getProjects(
    userId: string, 
    options: PaginationOptions & FilterOptions
  ): Promise<PaginatedResponse<Project>> {
    const { page, limit, search, sortBy = 'createdAt', sortOrder = 'desc', status, sourceLanguage, targetLanguage } = options;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              userId: userId
            }
          }
        }
      ],
      ...(search && {
        AND: [
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        ]
      }),
      ...(status && { status }),
      ...(sourceLanguage && { sourceLanguage }),
      ...(targetLanguage && { targetLanguage })
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            }
          },
          collaborators: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                }
              }
            }
          },
          _count: {
            select: {
              segments: true,
              collaborators: true,
            }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    };
  }

  static async getProjectById(projectId: string, userId: string): Promise<Project> {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              }
            }
          }
        },
        _count: {
          select: {
            segments: true,
            collaborators: true,
            translationMemory: true,
            glossaries: true,
          }
        }
      }
    });

    if (!project) {
      throw createError('Project not found or access denied', 404);
    }

    return project;
  }

  static async updateProject(
    projectId: string, 
    userId: string, 
    data: UpdateProjectRequest
  ): Promise<Project> {
    // Check if user is owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!project) {
      throw createError('Project not found or insufficient permissions', 404);
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    });

    return updatedProject;
  }

  static async deleteProject(projectId: string, userId: string): Promise<void> {
    // Check if user is owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId
      }
    });

    if (!project) {
      throw createError('Project not found or insufficient permissions', 404);
    }

    await prisma.project.delete({
      where: { id: projectId }
    });
  }

  static async addCollaborator(
    projectId: string, 
    ownerId: string, 
    email: string, 
    role: string
  ): Promise<ProjectCollaborator> {
    // Validate role
    const validRoles = ['translator', 'reviewer', 'viewer'];
    if (!validRoles.includes(role)) {
      throw createError('Invalid role. Must be translator, reviewer, or viewer', 400);
    }

    // Check if user is owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: ownerId
      }
    });

    if (!project) {
      throw createError('Project not found or insufficient permissions', 404);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if user is trying to add themselves
    if (user.id === ownerId) {
      throw createError('Cannot add yourself as a collaborator', 400);
    }

    // Check if user is already a collaborator
    const existingCollaboration = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (existingCollaboration) {
      throw createError('User is already a collaborator', 400);
    }

    // Add collaborator
    const collaboration = await prisma.projectCollaborator.create({
      data: {
        projectId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    return collaboration;
  }

  static async removeCollaborator(
    projectId: string, 
    ownerId: string, 
    collaboratorId: string
  ): Promise<void> {
    // Check if user is owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: ownerId
      }
    });

    if (!project) {
      throw createError('Project not found or insufficient permissions', 404);
    }

    // Check if collaborator exists
    const collaboration = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: collaboratorId
      }
    });

    if (!collaboration) {
      throw createError('Collaborator not found', 404);
    }

    // Don't allow removing the owner
    if (collaboration.role === 'owner') {
      throw createError('Cannot remove project owner', 400);
    }

    await prisma.projectCollaborator.delete({
      where: { id: collaboration.id }
    });
  }

  static async updateCollaboratorRole(
    projectId: string, 
    ownerId: string, 
    collaboratorId: string, 
    newRole: string
  ): Promise<ProjectCollaborator> {
    // Check if user is owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: ownerId
      }
    });

    if (!project) {
      throw createError('Project not found or insufficient permissions', 404);
    }

    // Check if collaborator exists
    const collaboration = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: collaboratorId
      }
    });

    if (!collaboration) {
      throw createError('Collaborator not found', 404);
    }

    // Don't allow changing owner role
    if (collaboration.role === 'owner') {
      throw createError('Cannot change owner role', 400);
    }

    const updatedCollaboration = await prisma.projectCollaborator.update({
      where: { id: collaboration.id },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    return updatedCollaboration;
  }
}

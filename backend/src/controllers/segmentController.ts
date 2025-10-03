import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleAsync } from '@/utils/errorHandler';
import { ApiResponse } from '@/types';

const prisma = new PrismaClient();

export class SegmentController {
  static getSegments = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { page = 1, limit = 50, status, search } = req.query;
    const userId = req.user!.id;

    console.log(`Getting segments for project ${projectId}, user ${userId}`);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } }
        ]
      }
    });

    if (!project) {
      console.log(`Project ${projectId} not found or access denied for user ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    console.log(`Project found: ${project.name}`);

    // Build where clause
    const where: any = { projectId };
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { sourceText: { contains: search as string, mode: 'insensitive' } },
        { targetText: { contains: search as string, mode: 'insensitive' } },
        { segmentKey: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    console.log(`Querying segments with where clause:`, where);

    // Get segments with pagination
    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
        where,
        include: {
          translator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          aiTranslations: {
            select: {
              id: true,
              aiProvider: true,
              modelName: true,
              translatedText: true,
              confidenceScore: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.segment.count({ where })
    ]);

    console.log(`Found ${segments.length} segments out of ${total} total for project ${projectId}`);
    console.log('Segments:', segments.map(s => ({ id: s.id, segmentKey: s.segmentKey, sourceText: s.sourceText })));

    const response: ApiResponse = {
      success: true,
      data: segments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      message: 'Segments retrieved successfully'
    };

    res.status(200).json(response);
  });

  static getSegmentById = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { segmentId } = req.params;
    const userId = req.user!.id;

    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        project: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId } } }
          ]
        }
      },
      include: {
        translator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        aiTranslations: {
          select: {
            id: true,
            aiProvider: true,
            modelName: true,
            translatedText: true,
            confidenceScore: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found or access denied'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: segment,
      message: 'Segment retrieved successfully'
    };

    res.status(200).json(response);
  });

  static createSegment = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { segmentKey, sourceText, targetText } = req.body;
    const userId = req.user!.id;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId, role: { in: ['owner', 'translator'] } } } }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    // Check if segment key already exists
    const existingSegment = await prisma.segment.findUnique({
      where: {
        projectId_segmentKey: {
          projectId,
          segmentKey
        }
      }
    });

    if (existingSegment) {
      return res.status(400).json({
        success: false,
        error: 'Segment with this key already exists'
      });
    }

    const segment = await prisma.segment.create({
      data: {
        segmentKey,
        sourceText,
        targetText,
        projectId,
        translatorId: targetText ? userId : null,
        status: targetText ? 'translated' : 'new'
      },
      include: {
        translator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: segment,
      message: 'Segment created successfully'
    };

    res.status(201).json(response);
  });

  static updateSegment = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { segmentId } = req.params;
    const { targetText, status } = req.body;
    const userId = req.user!.id;

    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        project: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId, role: { in: ['owner', 'translator', 'reviewer'] } } } }
          ]
        }
      }
    });

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found or access denied'
      });
    }

    // Determine the appropriate status and assignee
    let updateData: any = { targetText };
    
    if (status) {
      updateData.status = status;
    } else if (targetText && !segment.targetText) {
      // First translation
      updateData.status = 'translated';
      updateData.translatorId = userId;
    } else if (targetText && segment.targetText) {
      // Update translation
      updateData.status = 'translated';
      updateData.translatorId = userId;
    }

    const updatedSegment = await prisma.segment.update({
      where: { id: segmentId },
      data: updateData,
      include: {
        translator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    const response: ApiResponse = {
      success: true,
      data: updatedSegment,
      message: 'Segment updated successfully'
    };

    res.status(200).json(response);
  });

  static deleteSegment = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { segmentId } = req.params;
    const userId = req.user!.id;

    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        project: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId, role: { in: ['owner', 'translator'] } } } }
          ]
        }
      }
    });

    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found or access denied'
      });
    }

    await prisma.segment.delete({
      where: { id: segmentId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Segment deleted successfully'
    };

    res.status(200).json(response);
  });

  static bulkUpdateSegments = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { segments } = req.body;
    const userId = req.user!.id;

    console.log('Bulk update request received:', { projectId, userId, segmentsCount: segments?.length });
    console.log('Segments data:', segments);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId, role: { in: ['owner', 'translator', 'reviewer'] } } } }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    // Update segments in batch
    const updatePromises = segments.map((segment: any) => {
      const updateData: any = {};
      if (segment.targetText !== undefined) updateData.targetText = segment.targetText;
      if (segment.status !== undefined) updateData.status = segment.status;
      if (segment.targetText && !segment.originalTargetText) {
        updateData.translatorId = userId;
      }

      return prisma.segment.update({
        where: { id: segment.id },
        data: updateData
      });
    });

    await Promise.all(updatePromises);

    const response: ApiResponse = {
      success: true,
      message: 'Segments updated successfully'
    };

    res.status(200).json(response);
  });

  static getSegmentStats = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    const stats = await prisma.segment.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true }
    });

    const totalSegments = await prisma.segment.count({
      where: { projectId }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        total: totalSegments,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      message: 'Segment statistics retrieved successfully'
    };

    res.status(200).json(response);
  });
}

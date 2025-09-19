import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/utils/jwt';
import { createError } from '@/utils/errorHandler';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next(createError('Access token is required', 401));
    }

    const decoded = verifyAccessToken(token);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return next(createError('User not found', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    next(createError('Invalid or expired token', 401));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(createError('Authentication required', 401));
      }

      const projectId = req.params.projectId || req.params.id;
      
      if (!projectId) {
        return next(createError('Project ID is required', 400));
      }

      // Check if user has required role for the project
      const collaboration = await prisma.projectCollaborator.findFirst({
        where: {
          projectId,
          userId: req.user.id,
        },
        include: {
          project: {
            select: { ownerId: true }
          }
        }
      });

      // Check if user is project owner
      if (collaboration?.project.ownerId === req.user.id) {
        return next();
      }

      // Check if user has required role
      if (!collaboration || !roles.includes(collaboration.role)) {
        return next(createError('Insufficient permissions', 403));
      }

      next();
    } catch (error) {
      next(createError('Error checking permissions', 500));
    }
  };
};

export const requireProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const projectId = req.params.projectId || req.params.id;
    
    if (!projectId) {
      return next(createError('Project ID is required', 400));
    }

    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: req.user.id },
          {
            collaborators: {
              some: {
                userId: req.user.id
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return next(createError('Project not found or access denied', 404));
    }

    next();
  } catch (error) {
    next(createError('Error checking project access', 500));
  }
};

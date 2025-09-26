import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleAsync } from '@/utils/errorHandler';
import { ApiResponse } from '@/types';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export class FileController {
  static uploadFile = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

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
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    // Create file record in database
    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalFilename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        projectId,
        uploadedBy: userId
      },
      include: {
        uploader: {
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
      data: attachment,
      message: 'File uploaded successfully'
    };

    res.status(201).json(response);
  });

  static getProjectFiles = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
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

    const files = await prisma.attachment.findMany({
      where: { projectId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const response: ApiResponse = {
      success: true,
      data: files,
      message: 'Files retrieved successfully'
    };

    res.status(200).json(response);
  });

  static downloadFile = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const file = await prisma.attachment.findFirst({
      where: {
        id: fileId,
        project: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId } } }
          ]
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found or access denied'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
    res.setHeader('Content-Type', file.fileType);

    // Stream the file
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);
  });

  static deleteFile = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const file = await prisma.attachment.findFirst({
      where: {
        id: fileId,
        project: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId, role: { in: ['owner', 'translator'] } } } }
          ]
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found or access denied'
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete file record from database
    await prisma.attachment.delete({
      where: { id: fileId }
    });

    const response: ApiResponse = {
      success: true,
      message: 'File deleted successfully'
    };

    res.status(200).json(response);
  });
}

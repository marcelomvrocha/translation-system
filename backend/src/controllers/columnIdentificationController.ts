import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ColumnDetectionService } from '@/services/columnDetectionService';
import { ColumnConfigurationService } from '@/services/columnConfigurationService';
import { handleAsync } from '@/utils/errorHandler';
import { ApiResponse } from '@/types';

const prisma = new PrismaClient();

export class ColumnIdentificationController {
  /**
   * Detect columns in uploaded file
   */
  static detectColumns = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;
    const { sheetName, maxSampleRows = 10 } = req.query;

    // Get file information
    const file = await prisma.attachment.findUnique({
      where: { id: fileId },
      include: { project: true }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }

    // Check project access
    const userId = (req as any).user?.id;
    if (file.project.ownerId !== userId) {
      const hasAccess = await prisma.projectCollaborator.findFirst({
        where: {
          projectId: file.projectId,
          userId
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        } as ApiResponse);
      }
    }

    try {
      // Detect columns
      const columns = await ColumnDetectionService.detectColumns(
        file.filePath,
        file.fileType,
        sheetName as string,
        Number(maxSampleRows)
      );

      // Analyze columns
      const analysis = await ColumnDetectionService.analyzeColumnContent(columns);

      // Get preview data
      const previewData = await getPreviewData(file.filePath, file.fileType, sheetName as string);

      res.json({
        success: true,
        data: {
          columns,
          analysis,
          previewData: previewData.slice(0, 5), // First 5 rows
          totalRows: previewData.length,
          sheetName: sheetName as string || 'Sheet 1'
        }
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect columns'
      } as ApiResponse);
    }
  });

  /**
   * Save column configuration
   */
  static saveConfiguration = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, fileId } = req.params;
    const configuration = req.body;

    try {
      const savedConfig = await ColumnConfigurationService.saveConfiguration(
        projectId,
        fileId,
        configuration
      );

      res.json({
        success: true,
        data: savedConfig
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      } as ApiResponse);
    }
  });

  /**
   * Get column configuration
   */
  static getConfiguration = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, fileId } = req.params;

    try {
      const config = await ColumnConfigurationService.getConfiguration(projectId, fileId);

      res.json({
        success: true,
        data: config
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get configuration'
      } as ApiResponse);
    }
  });

  /**
   * Parse file with configuration
   */
  static parseWithConfiguration = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, fileId } = req.params;
    const { configurationId } = req.body;

    try {
      const result = await ColumnConfigurationService.parseWithConfiguration(
        projectId,
        fileId,
        configurationId
      );

      res.json({
        success: true,
        data: result
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse with configuration'
      } as ApiResponse);
    }
  });

  /**
   * Get column presets
   */
  static getPresets = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const presets = await ColumnConfigurationService.getPresets();

      res.json({
        success: true,
        data: presets
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get presets'
      } as ApiResponse);
    }
  });

  /**
   * Delete column configuration
   */
  static deleteConfiguration = handleAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, configurationId } = req.params;

    try {
      await ColumnConfigurationService.deleteConfiguration(projectId, configurationId);

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      } as ApiResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete configuration'
      } as ApiResponse);
    }
  });
}

/**
 * Helper function to get preview data from files
 */
async function getPreviewData(filePath: string, fileType: string, sheetName?: string): Promise<any[][]> {
  try {
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      const targetSheet = sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];
      return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else if (fileType === 'text/csv') {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
      return lines.map((line: string) => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting preview data:', error);
    return [];
  }
}

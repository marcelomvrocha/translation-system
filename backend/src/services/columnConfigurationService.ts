import { PrismaClient } from '@prisma/client';
import { ColumnConfiguration, ColumnMapping, ColumnPreset } from '@/types/columnIdentification';
import { FileParserService } from './fileParserService';

const prisma = new PrismaClient();

export class ColumnConfigurationService {
  /**
   * Save column configuration
   */
  static async saveConfiguration(
    projectId: string, 
    fileId: string, 
    configuration: Omit<ColumnConfiguration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ColumnConfiguration> {
    try {
      // Check if project and file exist
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const file = await prisma.attachment.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Create or update configuration
      const savedConfig = await prisma.columnConfiguration.upsert({
        where: {
          projectId_fileId: {
            projectId,
            fileId
          }
        },
        update: {
          name: configuration.name,
          description: configuration.description,
          configuration: configuration as any,
          updatedAt: new Date()
        },
        create: {
          projectId,
          fileId,
          name: configuration.name,
          description: configuration.description,
          configuration: configuration as any
        }
      });

      // Save column mappings
      if (configuration.mappings && configuration.mappings.length > 0) {
        // Delete existing mappings
        await prisma.columnMapping.deleteMany({
          where: { configurationId: savedConfig.id }
        });

        // Create new mappings
        await prisma.columnMapping.createMany({
          data: configuration.mappings.map(mapping => ({
            configurationId: savedConfig.id,
            columnIndex: mapping.columnIndex,
            columnName: mapping.columnName,
            columnType: mapping.columnType,
            languageCode: mapping.languageCode,
            isRequired: mapping.isRequired,
            customSettings: mapping.customSettings
          }))
        });
      }

      return {
        id: savedConfig.id,
        name: savedConfig.name,
        description: savedConfig.description,
        fileId: savedConfig.fileId,
        sheetName: configuration.sheetName,
        mappings: configuration.mappings,
        isDefault: savedConfig.isDefault,
        createdAt: savedConfig.createdAt,
        updatedAt: savedConfig.updatedAt
      };
    } catch (error) {
      console.error('Error saving column configuration:', error);
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get column configuration for a file
   */
  static async getConfiguration(projectId: string, fileId: string): Promise<ColumnConfiguration | null> {
    try {
      const config = await prisma.columnConfiguration.findFirst({
        where: {
          projectId,
          fileId
        },
        include: {
          mappings: true
        }
      });

      if (!config) {
        return null;
      }

      return {
        id: config.id,
        name: config.name,
        description: config.description,
        fileId: config.fileId,
        sheetName: (config.configuration as any)?.sheetName,
        mappings: config.mappings.map(mapping => ({
          id: mapping.id,
          columnIndex: mapping.columnIndex,
          columnName: mapping.columnName,
          columnType: mapping.columnType as any,
          languageCode: mapping.languageCode,
          isRequired: mapping.isRequired,
          customSettings: mapping.customSettings as any
        })),
        isDefault: config.isDefault,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      };
    } catch (error) {
      console.error('Error getting column configuration:', error);
      throw new Error(`Failed to get configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse file with column configuration
   */
  static async parseWithConfiguration(
    projectId: string, 
    fileId: string, 
    configurationId: string
  ): Promise<{ parsed: number; skipped: number; segments: any[] }> {
    try {
      // Get configuration
      const config = await prisma.columnConfiguration.findUnique({
        where: { id: configurationId },
        include: {
          mappings: true,
          file: true
        }
      });

      if (!config) {
        throw new Error('Configuration not found');
      }

      if (config.projectId !== projectId) {
        throw new Error('Configuration does not belong to this project');
      }

      if (!config.file) {
        throw new Error('File not found');
      }

      // Parse file with custom column mapping
      const segments = await this.parseFileWithColumnMapping(
        config.file.filePath,
        config.file.fileType,
        config.mappings,
        projectId
      );

      return {
        parsed: segments.length,
        skipped: 0,
        segments
      };
    } catch (error) {
      console.error('Error parsing with configuration:', error);
      throw new Error(`Failed to parse with configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse file with custom column mapping
   */
  private static async parseFileWithColumnMapping(
    filePath: string,
    fileType: string,
    mappings: any[],
    projectId: string
  ): Promise<any[]> {
    const segments: any[] = [];
    
    try {
      // Group mappings by type
      const sourceMappings = mappings.filter(m => m.columnType === 'source');
      const targetMappings = mappings.filter(m => m.columnType === 'target');
      const contextMappings = mappings.filter(m => m.columnType === 'context');
      const notesMappings = mappings.filter(m => m.columnType === 'notes');
      const keyMappings = mappings.filter(m => m.columnType === 'key');

      // Parse file based on type
      let data: any[][];
      
      if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        data = await this.parseExcelData(filePath);
      } else if (fileType === 'text/csv') {
        data = await this.parseCsvData(filePath);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      console.log(`Processing ${data.length - 1} data rows (excluding header)`);
      console.log('Mappings:', mappings);

      // Process each row
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) { // Skip header row
        const row = data[rowIndex];
        if (!row || row.length === 0) continue;

        // Extract data based on mappings
        const sourceTexts = sourceMappings.map(m => row[m.columnIndex] || '').filter(t => t.trim());
        const targetTexts = targetMappings.map(m => row[m.columnIndex] || '').filter(t => t.trim());
        const contexts = contextMappings.map(m => row[m.columnIndex] || '').filter(t => t.trim());
        const notes = notesMappings.map(m => row[m.columnIndex] || '').filter(t => t.trim());
        const keys = keyMappings.map(m => row[m.columnIndex] || '').filter(t => t.trim());

        console.log(`Row ${rowIndex}:`, { sourceTexts, targetTexts, contexts, notes, keys });

        // Create segments for each source text
        sourceTexts.forEach((sourceText, sourceIndex) => {
          const segmentKey = keys[0] || `row_${rowIndex}_source_${sourceIndex}`;
          const targetText = targetTexts[sourceIndex] || '';
          const context = contexts.join(' | ') || undefined;
          const note = notes.join(' | ') || undefined;

          const segment = {
            segmentKey,
            sourceText: sourceText.trim(),
            targetText: targetText.trim() || null,
            context,
            notes: note,
            status: targetText.trim() ? 'translated' : 'new'
          };

          console.log(`Creating segment:`, segment);
          segments.push(segment);
        });
      }

      console.log(`Total segments created: ${segments.length}`);

      // Save segments to database
      await this.saveSegmentsToDatabase(segments, projectId);

      return segments;
    } catch (error) {
      console.error('Error parsing file with column mapping:', error);
      throw error;
    }
  }

  /**
   * Parse Excel data
   */
  private static async parseExcelData(filePath: string): Promise<any[][]> {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }

  /**
   * Parse CSV data
   */
  private static async parseCsvData(filePath: string): Promise<any[][]> {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
    return lines.map((line: string) => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
  }

  /**
   * Save segments to database
   */
  private static async saveSegmentsToDatabase(segments: any[], projectId: string): Promise<void> {
    if (segments.length === 0) return;

    // Check if segments already exist
    const existingSegments = await prisma.segment.findMany({
      where: { projectId },
      select: { segmentKey: true }
    });

    const existingKeys = new Set(existingSegments.map(s => s.segmentKey));
    const newSegments = segments.filter(s => !existingKeys.has(s.segmentKey));

    if (newSegments.length > 0) {
      await prisma.segment.createMany({
        data: newSegments.map(segment => ({
          segmentKey: segment.segmentKey,
          sourceText: segment.sourceText,
          targetText: segment.targetText,
          projectId,
          status: segment.status
        }))
      });
      
      console.log(`Created ${newSegments.length} segments for project ${projectId}`);
    } else {
      console.log('No new segments to create - all segments already exist');
    }
  }

  /**
   * Get available column presets
   */
  static async getPresets(): Promise<ColumnPreset[]> {
    return [
      {
        id: 'common',
        name: 'Common Translation',
        description: 'Source and target columns with context',
        category: 'common',
        isBuiltIn: true,
        mappings: [
          { columnIndex: 0, columnName: 'Source', columnType: 'source', languageCode: 'en', isRequired: true },
          { columnIndex: 1, columnName: 'Target', columnType: 'target', languageCode: 'es', isRequired: true },
          { columnIndex: 2, columnName: 'Context', columnType: 'context', isRequired: false }
        ]
      },
      {
        id: 'translation_memory',
        name: 'Translation Memory',
        description: 'TMX-like format with keys',
        category: 'translation_memory',
        isBuiltIn: true,
        mappings: [
          { columnIndex: 0, columnName: 'Key', columnType: 'key', isRequired: true },
          { columnIndex: 1, columnName: 'Source', columnType: 'source', languageCode: 'en', isRequired: true },
          { columnIndex: 2, columnName: 'Target', columnType: 'target', languageCode: 'es', isRequired: true },
          { columnIndex: 3, columnName: 'Context', columnType: 'context', isRequired: false }
        ]
      },
      {
        id: 'glossary',
        name: 'Glossary',
        description: 'Term and definition format',
        category: 'glossary',
        isBuiltIn: true,
        mappings: [
          { columnIndex: 0, columnName: 'Term', columnType: 'source', languageCode: 'en', isRequired: true },
          { columnIndex: 1, columnName: 'Definition', columnType: 'context', isRequired: true },
          { columnIndex: 2, columnName: 'Translation', columnType: 'target', languageCode: 'es', isRequired: false }
        ]
      }
    ];
  }

  /**
   * Delete column configuration
   */
  static async deleteConfiguration(projectId: string, configurationId: string): Promise<void> {
    try {
      const config = await prisma.columnConfiguration.findUnique({
        where: { id: configurationId }
      });

      if (!config) {
        throw new Error('Configuration not found');
      }

      if (config.projectId !== projectId) {
        throw new Error('Configuration does not belong to this project');
      }

      await prisma.columnConfiguration.delete({
        where: { id: configurationId }
      });
    } catch (error) {
      console.error('Error deleting column configuration:', error);
      throw new Error(`Failed to delete configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

import fs from 'fs';
import * as XLSX from 'xlsx';
import * as yauzl from 'yauzl';
import { PrismaClient } from '@prisma/client';
import { ColumnInfo, ColumnAnalysis, ColumnTypeSuggestion, ColumnType } from '@/types/columnIdentification';

const prisma = new PrismaClient();

export class ColumnDetectionService {
  /**
   * Detect columns from uploaded files
   */
  static async detectColumns(filePath: string, fileType: string, sheetName?: string, maxSampleRows: number = 10): Promise<ColumnInfo[]> {
    try {
      console.log('ColumnDetectionService.detectColumns called with:', { filePath, fileType, sheetName, maxSampleRows });
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      let columns: ColumnInfo[] = [];

      switch (fileType) {
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          columns = await this.detectExcelColumns(filePath, sheetName, maxSampleRows);
          break;
        case 'text/csv':
          columns = await this.detectCsvColumns(filePath, maxSampleRows);
          break;
        case 'application/vnd.apple.numbers':
        case 'application/zip':
        case 'application/x-iwork-numbers':
        case 'application/octet-stream':
          if (filePath.endsWith('.numbers')) {
            columns = await this.detectNumbersColumns(filePath, maxSampleRows);
          } else {
            throw new Error('Unsupported file type for column detection');
          }
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return columns;
    } catch (error) {
      console.error('Error detecting columns:', error);
      throw new Error(`Failed to detect columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze column content to suggest column types
   */
  static async analyzeColumnContent(columns: ColumnInfo[]): Promise<ColumnAnalysis[]> {
    return columns.map(column => {
      const analysis = this.analyzeColumn(column);
      const suggestions = this.suggestColumnTypes(column, analysis);
      
      return {
        columnIndex: column.index,
        columnName: column.name,
        analysis,
        suggestions
      };
    });
  }

  /**
   * Detect columns from Excel files
   */
  private static async detectExcelColumns(filePath: string, sheetName?: string, maxSampleRows: number = 10): Promise<ColumnInfo[]> {
    const workbook = XLSX.readFile(filePath);
    const targetSheet = sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[targetSheet];
    
    if (!worksheet) {
      throw new Error(`Sheet '${targetSheet}' not found`);
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    return this.processDataToColumns(jsonData, maxSampleRows);
  }

  /**
   * Detect columns from CSV files
   */
  private static async detectCsvColumns(filePath: string, maxSampleRows: number = 10): Promise<ColumnInfo[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const data = lines.slice(0, maxSampleRows + 1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return this.processDataToColumns(data, maxSampleRows);
  }

  /**
   * Detect columns from Numbers files
   */
  private static async detectNumbersColumns(filePath: string, maxSampleRows: number = 10): Promise<ColumnInfo[]> {
    return new Promise((resolve, reject) => {
      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open Numbers file: ${err.message}`));
          return;
        }

        if (!zipfile) {
          reject(new Error('Numbers file is empty'));
          return;
        }

        // For now, return a basic structure
        // In a full implementation, you would parse the Numbers file structure
        resolve([
          {
            index: 0,
            name: 'Column 1',
            sampleValues: ['Sample data'],
            dataType: 'text' as const,
            isEmpty: false,
            uniqueValues: 1,
            totalValues: 1,
            suggestedType: 'source' as const,
            confidence: 0.5
          }
        ]);
      });
    });
  }

  /**
   * Process raw data into column information
   */
  private static processDataToColumns(data: any[][], maxSampleRows: number): ColumnInfo[] {
    if (data.length === 0) return [];

    const maxRows = Math.min(data.length, maxSampleRows + 1);
    const sampleData = data.slice(0, maxRows);
    const maxColumns = Math.max(...sampleData.map(row => row.length));

    const columns: ColumnInfo[] = [];

    for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
      const columnData = sampleData.map(row => row[colIndex]).filter(cell => cell !== undefined);
      const sampleValues = columnData.slice(0, 5); // First 5 values as samples
      
      const analysis = this.analyzeColumnData(columnData);
      const suggestedType = this.suggestColumnType(analysis, colIndex, sampleData[0]?.[colIndex]);

      columns.push({
        index: colIndex,
        name: this.generateColumnName(colIndex, sampleData[0]?.[colIndex]),
        sampleValues: sampleValues.map(val => String(val || '')),
        dataType: analysis.dataType,
        isEmpty: analysis.isEmpty,
        uniqueValues: analysis.uniqueValues,
        totalValues: columnData.length,
        suggestedType: suggestedType.type,
        confidence: suggestedType.confidence
      });
    }

    return columns;
  }

  /**
   * Analyze column data to determine properties
   */
  private static analyzeColumnData(data: any[]): {
    dataType: 'text' | 'number' | 'date' | 'boolean' | 'empty';
    isEmpty: boolean;
    uniqueValues: number;
  } {
    const nonEmptyData = data.filter(val => val !== null && val !== undefined && val !== '');
    const uniqueValues = new Set(nonEmptyData.map(val => String(val))).size;
    
    if (nonEmptyData.length === 0) {
      return { dataType: 'empty', isEmpty: true, uniqueValues: 0 };
    }

    // Determine data type
    let dataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
    
    if (nonEmptyData.every(val => !isNaN(Number(val)))) {
      dataType = 'number';
    } else if (nonEmptyData.every(val => 
      typeof val === 'boolean' || 
      ['true', 'false', 'yes', 'no', '1', '0'].includes(String(val).toLowerCase())
    )) {
      dataType = 'boolean';
    } else if (nonEmptyData.every(val => !isNaN(Date.parse(String(val))))) {
      dataType = 'date';
    }

    return {
      dataType,
      isEmpty: nonEmptyData.length === 0,
      uniqueValues
    };
  }

  /**
   * Generate column name from index and first value
   */
  private static generateColumnName(index: number, firstValue?: any): string {
    if (firstValue && typeof firstValue === 'string' && firstValue.trim().length > 0) {
      return firstValue.trim();
    }
    return `Column ${index + 1}`;
  }

  /**
   * Suggest column type based on analysis
   */
  private static suggestColumnType(analysis: any, columnIndex: number, firstValue?: any): ColumnTypeSuggestion {
    const columnName = String(firstValue || '').toLowerCase();
    
    // Check for common patterns
    const patterns = {
      source: [/english/i, /source/i, /original/i, /text/i, /content/i],
      target: [/spanish/i, /french/i, /german/i, /target/i, /translation/i, /translated/i],
      context: [/context/i, /note/i, /comment/i, /description/i, /info/i],
      status: [/status/i, /state/i, /progress/i, /done/i, /new/i, /complete/i],
      key: [/id/i, /key/i, /identifier/i, /ref/i, /number/i]
    };

    for (const [type, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        if (regex.test(columnName)) {
          return {
            type: type as ColumnType,
            confidence: 0.8,
            reason: `Column name matches ${type} pattern`,
            languageCode: this.extractLanguageCode(columnName, type as ColumnType)
          };
        }
      }
    }

    // Default suggestions based on data type and position
    if (analysis.dataType === 'text' && !analysis.isEmpty) {
      if (columnIndex === 0) {
        return { type: 'source', confidence: 0.6, reason: 'First text column, likely source' };
      } else if (columnIndex === 1) {
        return { type: 'target', confidence: 0.6, reason: 'Second text column, likely target' };
      } else {
        return { type: 'context', confidence: 0.4, reason: 'Additional text column, likely context' };
      }
    }

    return { type: 'skip', confidence: 0.3, reason: 'Unclear column purpose' };
  }

  /**
   * Extract language code from column name
   */
  private static extractLanguageCode(columnName: string, type: ColumnType): string | undefined {
    if (type !== 'source' && type !== 'target') return undefined;

    const languageMap: Record<string, string> = {
      'english': 'en',
      'spanish': 'es',
      'french': 'fr',
      'german': 'de',
      'italian': 'it',
      'portuguese': 'pt',
      'chinese': 'zh',
      'japanese': 'ja',
      'korean': 'ko',
      'russian': 'ru',
      'arabic': 'ar'
    };

    for (const [lang, code] of Object.entries(languageMap)) {
      if (columnName.includes(lang)) {
        return code;
      }
    }

    return undefined;
  }

  /**
   * Analyze individual column
   */
  private static analyzeColumn(column: ColumnInfo) {
    return {
      dataType: column.dataType,
      isEmpty: column.isEmpty,
      uniqueValues: column.uniqueValues,
      totalValues: column.totalValues,
      sampleValues: column.sampleValues,
      patterns: this.extractPatterns(column.sampleValues)
    };
  }

  /**
   * Extract patterns from sample values
   */
  private static extractPatterns(values: string[]): string[] {
    const patterns: string[] = [];
    
    // Check for common patterns
    if (values.every(v => /^\d+$/.test(v))) patterns.push('numeric');
    if (values.every(v => /^[A-Z_]+$/.test(v))) patterns.push('uppercase');
    if (values.every(v => /^[a-z_]+$/.test(v))) patterns.push('lowercase');
    if (values.every(v => v.length > 10)) patterns.push('long_text');
    if (values.every(v => v.length < 5)) patterns.push('short_text');
    
    return patterns;
  }

  /**
   * Suggest column types based on analysis
   */
  private static suggestColumnTypes(column: ColumnInfo, analysis: any): ColumnTypeSuggestion[] {
    const suggestions: ColumnTypeSuggestion[] = [];
    
    // High confidence suggestions
    if (column.confidence > 0.7) {
      suggestions.push({
        type: column.suggestedType,
        confidence: column.confidence,
        reason: 'High confidence based on column name and content'
      });
    }

    // Medium confidence suggestions
    if (column.dataType === 'text' && !column.isEmpty) {
      suggestions.push(
        { type: 'source', confidence: 0.6, reason: 'Text column suitable for source content' },
        { type: 'target', confidence: 0.6, reason: 'Text column suitable for target content' },
        { type: 'context', confidence: 0.5, reason: 'Text column suitable for context information' }
      );
    }

    if (column.dataType === 'text' && analysis.patterns.includes('short_text')) {
      suggestions.push({ type: 'key', confidence: 0.7, reason: 'Short text likely to be identifier' });
    }

    // Always include skip option
    suggestions.push({ type: 'skip', confidence: 0.3, reason: 'Skip this column' });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}

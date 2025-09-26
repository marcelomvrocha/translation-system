import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as yauzl from 'yauzl';

const prisma = new PrismaClient();

export interface ParsedSegment {
  segmentKey: string;
  sourceText: string;
  targetText?: string;
}

export class FileParserService {
  static async parseFile(filePath: string, fileType: string, projectId: string): Promise<ParsedSegment[]> {
    const segments: ParsedSegment[] = [];

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      switch (fileType) {
        case 'text/plain':
          segments.push(...this.parseTextFile(fileContent));
          break;
        case 'application/json':
          segments.push(...this.parseJsonFile(fileContent));
          break;
        case 'application/xml':
        case 'text/xml':
          segments.push(...this.parseXmlFile(fileContent));
          break;
        case 'text/csv':
          segments.push(...this.parseCsvFile(fileContent));
          break;
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          segments.push(...this.parseExcelFile(filePath));
          break;
        case 'application/vnd.apple.numbers':
        case 'application/zip':
        case 'application/x-iwork-numbers':
        case 'application/octet-stream':
          // Check if it's a Numbers file by extension or content
          if (filePath.endsWith('.numbers') || this.isNumbersFile(fileContent)) {
            const numbersSegments = await this.parseNumbersFile(filePath);
            segments.push(...numbersSegments);
          } else {
            throw new Error(`Unsupported file type: ${fileType}`);
          }
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Save segments to database
      await this.saveSegmentsToDatabase(segments, projectId);

      return segments;
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parseTextFile(content: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);

    lines.forEach((line, index) => {
      if (line.trim()) {
        segments.push({
          segmentKey: `line_${index + 1}`,
          sourceText: line.trim()
        });
      }
    });

    return segments;
  }

  private static parseJsonFile(content: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    
    try {
      const data = JSON.parse(content);
      this.extractFromJsonObject(data, segments, '');
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    return segments;
  }

  private static extractFromJsonObject(obj: any, segments: ParsedSegment[], prefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      const segmentKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string' && value.trim().length > 0) {
        segments.push({
          segmentKey,
          sourceText: value.trim()
        });
      } else if (typeof value === 'object' && value !== null) {
        this.extractFromJsonObject(value, segments, segmentKey);
      }
    }
  }

  private static parseXmlFile(content: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    
    // Simple XML parser - looks for text content in XML elements
    const textRegex = />([^<]+)</g;
    let match;
    let index = 1;

    while ((match = textRegex.exec(content)) !== null) {
      const text = match[1].trim();
      if (text.length > 0) {
        segments.push({
          segmentKey: `xml_element_${index}`,
          sourceText: text
        });
        index++;
      }
    }

    return segments;
  }

  private static parseCsvFile(content: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return segments;

    // Assume first row is header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const sourceColumnIndex = headers.findIndex(h => 
      h.toLowerCase().includes('source') || h.toLowerCase().includes('original')
    );
    const targetColumnIndex = headers.findIndex(h => 
      h.toLowerCase().includes('target') || h.toLowerCase().includes('translation')
    );

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      
      if (sourceColumnIndex >= 0 && columns[sourceColumnIndex]) {
        segments.push({
          segmentKey: `csv_row_${i}`,
          sourceText: columns[sourceColumnIndex],
          targetText: targetColumnIndex >= 0 ? columns[targetColumnIndex] || null : null
        });
      }
    }

    return segments;
  }

  private static parseExcelFile(filePath: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    
    try {
      const workbook = XLSX.readFile(filePath);
      let segmentIndex = 1;

      // Process each worksheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Find columns that might contain translatable text
        const textColumns: number[] = [];
        if (jsonData.length > 0) {
          const firstRow = jsonData[0] as any[];
          firstRow.forEach((cell, index) => {
            if (typeof cell === 'string' && 
                (cell.toLowerCase().includes('text') || 
                 cell.toLowerCase().includes('content') ||
                 cell.toLowerCase().includes('message') ||
                 cell.toLowerCase().includes('description') ||
                 cell.toLowerCase().includes('english') ||
                 cell.toLowerCase().includes('spanish') ||
                 cell.toLowerCase().includes('translation') ||
                 cell.toLowerCase().includes('source') ||
                 cell.toLowerCase().includes('target'))) {
              textColumns.push(index);
            }
          });
        }

        // If no specific text columns found, use all columns
        if (textColumns.length === 0) {
          for (let i = 0; i < (jsonData[0] as any[]).length; i++) {
            textColumns.push(i);
          }
        }

        // Extract text from each row
        jsonData.forEach((row: any[], rowIndex) => {
          if (!Array.isArray(row)) return;
          
          // Check if first row looks like headers (contains common header words)
          const isHeaderRow = rowIndex === 0 && row.some(cell => 
            typeof cell === 'string' && 
            (cell.toLowerCase().includes('english') || 
             cell.toLowerCase().includes('spanish') ||
             cell.toLowerCase().includes('text') ||
             cell.toLowerCase().includes('translation'))
          );
          
          if (isHeaderRow) return; // Skip header row
          
          // Extract text from all columns or just the identified text columns
          const columnsToProcess = textColumns.length > 0 ? textColumns : Array.from({length: row.length}, (_, i) => i);
          
          columnsToProcess.forEach(colIndex => {
            const cellValue = row[colIndex];
            if (cellValue && typeof cellValue === 'string' && cellValue.trim().length > 0) {
              segments.push({
                segmentKey: `excel_${sheetName}_row${rowIndex}_col${colIndex}`,
                sourceText: cellValue.trim()
              });
              segmentIndex++;
            }
          });
        });
      });
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return segments;
  }

  private static async parseNumbersFile(filePath: string): Promise<ParsedSegment[]> {
    const segments: ParsedSegment[] = [];
    
    return new Promise((resolve) => {
      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          console.error('Error opening Numbers file:', err);
          resolve([]);
          return;
        }

        if (!zipfile) {
          resolve([]);
          return;
        }

        let segmentIndex = 1;
        let processedEntries = 0;
        const totalEntries = zipfile.entryCount;

        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (/\.(xml|iwa)$/.test(entry.fileName)) {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                console.error('Error reading Numbers file entry:', err);
                processedEntries++;
                if (processedEntries === totalEntries) {
                  resolve(segments);
                } else {
                  zipfile.readEntry();
                }
                return;
              }

              let xmlContent = '';
              readStream.on('data', (chunk) => {
                xmlContent += chunk.toString();
              });

              readStream.on('end', () => {
                // Extract text content from Numbers files
                // Try multiple patterns for different file types
                const patterns = [
                  /<t[^>]*>([^<]+)<\/t>/g,  // XML text tags
                  /"([^"]{3,})"/g,          // Quoted strings
                  /'([^']{3,})'/g,          // Single quoted strings
                  /([A-Za-z][A-Za-z0-9\s.,!?;:'"-]{2,})/g  // General text patterns
                ];
                
                let foundText = false;
                patterns.forEach(pattern => {
                  let match;
                  while ((match = pattern.exec(xmlContent)) !== null) {
                    const text = match[1] ? match[1].trim() : match[0].trim();
                    if (text.length > 2 && 
                        !text.match(/^\d+$/) && 
                        !text.match(/^[A-Z_]+$/) &&
                        !text.match(/^[a-z]+$/)) {
                      segments.push({
                        segmentKey: `numbers_${segmentIndex}`,
                        sourceText: text
                      });
                      segmentIndex++;
                      foundText = true;
                    }
                  }
                });
                
                // If no text found with patterns, try a more general approach
                if (!foundText && xmlContent.length > 100) {
                  const generalTextRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"-]{2,}/g;
                  let generalMatch;
                  while ((generalMatch = generalTextRegex.exec(xmlContent)) !== null) {
                    const text = generalMatch[0].trim();
                    if (text.length > 2 && !text.match(/^\d+$/) && !text.match(/^[A-Z_]+$/)) {
                      segments.push({
                        segmentKey: `numbers_${segmentIndex}`,
                        sourceText: text
                      });
                      segmentIndex++;
                    }
                  }
                }

                processedEntries++;
                if (processedEntries === totalEntries) {
                  resolve(segments);
                } else {
                  zipfile.readEntry();
                }
              });
            });
          } else {
            processedEntries++;
            if (processedEntries === totalEntries) {
              resolve(segments);
            } else {
              zipfile.readEntry();
            }
          }
        });

        zipfile.on('end', () => {
          resolve(segments);
        });
      });
    });
  }

  private static isNumbersFile(content: string): boolean {
    // Check for Numbers file signatures
    // Numbers files are ZIP archives with specific internal structure
    const numbersSignatures = [
      'PK\x03\x04', // ZIP file signature
      'iWork', // iWork signature
      'Numbers', // Numbers signature
      'com.apple.iwork.numbers' // Numbers bundle identifier
    ];
    
    return numbersSignatures.some(signature => content.includes(signature));
  }

  private static async saveSegmentsToDatabase(segments: ParsedSegment[], projectId: string): Promise<void> {
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
          targetText: segment.targetText || null,
          projectId,
          status: segment.targetText ? 'translated' : 'new'
        }))
      });
    }
  }

  static async parseProjectFiles(projectId: string): Promise<{ parsed: number; skipped: number }> {
    const attachments = await prisma.attachment.findMany({
      where: { projectId },
      select: { id: true, filePath: true, fileType: true }
    });

    let parsed = 0;
    let skipped = 0;

    for (const attachment of attachments) {
      try {
        const segments = await this.parseFile(attachment.filePath, attachment.fileType, projectId);
        parsed += segments.length;
      } catch (error) {
        console.error(`Failed to parse file ${attachment.id}:`, error);
        skipped++;
      }
    }

    return { parsed, skipped };
  }

  static getSupportedFileTypes(): string[] {
    return [
      'text/plain',
      'application/json',
      'application/xml',
      'text/xml',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.apple.numbers',
      'application/zip',
      'application/x-iwork-numbers',
      'application/octet-stream'
    ];
  }
}

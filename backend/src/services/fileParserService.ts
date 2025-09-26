import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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
        case 'application/vnd.apple.numbers':
        case 'application/zip':
        case 'application/x-iwork-numbers':
        case 'application/octet-stream':
          // Check if it's a Numbers file by extension or content
          if (filePath.endsWith('.numbers') || this.isNumbersFile(fileContent)) {
            segments.push(...this.parseNumbersFile(fileContent));
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
          targetText: targetColumnIndex >= 0 ? columns[targetColumnIndex] : undefined
        });
      }
    }

    return segments;
  }

  private static parseNumbersFile(content: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    
    try {
      // Numbers files are actually ZIP archives containing XML
      // For now, we'll try to extract text content from the XML structure
      // This is a simplified parser - in production, you might want to use a proper Numbers parser
      
      // Look for text content in the XML structure
      const textRegex = /<t[^>]*>([^<]+)<\/t>/g;
      let match;
      let index = 1;

      while ((match = textRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 0 && !text.match(/^\d+$/) && text.length > 2) {
          // Skip pure numbers and very short text
          segments.push({
            segmentKey: `numbers_cell_${index}`,
            sourceText: text
          });
          index++;
        }
      }

      // If no text found with the above method, try a more general approach
      if (segments.length === 0) {
        const generalTextRegex = />([^<>{}\[\]]{3,})</g;
        let generalMatch;
        let generalIndex = 1;

        while ((generalMatch = generalTextRegex.exec(content)) !== null) {
          const text = generalMatch[1].trim();
          if (text.length > 0 && !text.match(/^\d+$/) && !text.match(/^[A-Z_]+$/)) {
            segments.push({
              segmentKey: `numbers_content_${generalIndex}`,
              sourceText: text
            });
            generalIndex++;
          }
        }
      }
    } catch (error) {
      console.error('Error parsing Numbers file:', error);
      // Fallback: treat as plain text
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      lines.forEach((line, index) => {
        const text = line.trim();
        if (text.length > 0) {
          segments.push({
            segmentKey: `numbers_line_${index + 1}`,
            sourceText: text
          });
        }
      });
    }

    return segments;
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
          targetText: segment.targetText,
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
      'application/vnd.apple.numbers',
      'application/zip',
      'application/x-iwork-numbers',
      'application/octet-stream'
    ];
  }
}

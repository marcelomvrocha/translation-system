export interface ColumnInfo {
  index: number;
  name: string;
  sampleValues: string[];
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'empty';
  isEmpty: boolean;
  uniqueValues: number;
  totalValues: number;
  suggestedType: ColumnType;
  confidence: number;
}

export type ColumnType = 
  | 'source' 
  | 'target' 
  | 'context' 
  | 'notes' 
  | 'status' 
  | 'key' 
  | 'skip';

export interface ColumnTypeSuggestion {
  type: ColumnType;
  confidence: number;
  reason: string;
  languageCode?: string;
}

export interface ColumnAnalysis {
  columnIndex: number;
  columnName: string;
  analysis: {
    dataType: string;
    isEmpty: boolean;
    uniqueValues: number;
    totalValues: number;
    sampleValues: string[];
    patterns: string[];
  };
  suggestions: ColumnTypeSuggestion[];
}

export interface ColumnMapping {
  id?: string;
  columnIndex: number;
  columnName: string;
  columnType: ColumnType;
  languageCode?: string;
  isRequired: boolean;
  customSettings?: Record<string, any>;
}

export interface ColumnConfiguration {
  id?: string;
  name?: string;
  description?: string;
  fileId?: string;
  sheetName?: string;
  mappings: ColumnMapping[];
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ColumnDetectionRequest {
  fileId: string;
  sheetName?: string;
  maxSampleRows?: number;
}

export interface ColumnDetectionResponse {
  success: boolean;
  data?: {
    columns: ColumnInfo[];
    previewData: any[][];
    totalRows: number;
    sheetName: string;
  };
  error?: string;
}

export interface ColumnConfigurationRequest {
  projectId: string;
  fileId: string;
  configuration: ColumnConfiguration;
}

export interface ColumnConfigurationResponse {
  success: boolean;
  data?: ColumnConfiguration;
  error?: string;
}

export interface ParseWithConfigurationRequest {
  projectId: string;
  fileId: string;
  configurationId: string;
}

export interface ParseWithConfigurationResponse {
  success: boolean;
  data?: {
    parsed: number;
    skipped: number;
    segments: any[];
  };
  error?: string;
}

export interface ColumnPreset {
  id: string;
  name: string;
  description: string;
  category: 'common' | 'translation_memory' | 'glossary' | 'custom';
  mappings: Omit<ColumnMapping, 'id'>[];
  isBuiltIn: boolean;
}

export interface ColumnPresetResponse {
  success: boolean;
  data?: ColumnPreset[];
  error?: string;
}

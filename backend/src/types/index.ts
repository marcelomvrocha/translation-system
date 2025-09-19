// Common types used across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCollaborator {
  id: string;
  role: 'owner' | 'translator' | 'reviewer' | 'viewer';
  projectId: string;
  userId: string;
  user: User;
  createdAt: Date;
}

export interface Segment {
  id: string;
  segmentKey: string;
  sourceText: string;
  targetText?: string;
  status: 'new' | 'in_progress' | 'translated' | 'reviewed' | 'approved';
  projectId: string;
  translatorId?: string;
  reviewerId?: string;
  translator?: User;
  reviewer?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  matchPercentage?: number;
  projectId: string;
  createdAt: Date;
}

export interface Glossary {
  id: string;
  term: string;
  definition?: string;
  translation?: string;
  category?: string;
  projectId: string;
  createdAt: Date;
}

export interface AiTranslation {
  id: string;
  aiProvider: 'openai' | 'deepl' | 'google' | 'azure' | 'offline_model';
  modelName?: string;
  translatedText: string;
  confidenceScore?: number;
  segmentId: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  projectId: string;
  uploadedBy: string;
  uploader: User;
  createdAt: Date;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface CreateSegmentRequest {
  segmentKey: string;
  sourceText: string;
  targetText?: string;
}

export interface UpdateSegmentRequest {
  targetText?: string;
  status?: string;
}

export interface CreateCollaboratorRequest {
  email: string;
  role: 'translator' | 'reviewer' | 'viewer';
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

// Socket.io types
export interface SocketUser {
  userId: string;
  projectId: string;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface CursorUpdate {
  userId: string;
  projectId: string;
  cursor: {
    x: number;
    y: number;
  };
}

export interface SegmentUpdate {
  segmentId: string;
  projectId: string;
  updates: Partial<Segment>;
  userId: string;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// AI Translation types
export interface AiTranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider?: 'openai' | 'deepl' | 'google' | 'azure' | 'offline_model';
  context?: string;
}

export interface AiTranslationResponse {
  translatedText: string;
  confidenceScore?: number;
  provider: string;
  modelName?: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Database query types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  status?: string;
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

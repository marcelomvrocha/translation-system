// Common types used across the frontend application

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
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  collaborators?: ProjectCollaborator[];
  _count?: {
    segments: number;
    collaborators: number;
    translationMemory: number;
    glossaries: number;
  };
}

export interface ProjectCollaborator {
  id: string;
  role: 'owner' | 'translator' | 'reviewer' | 'viewer';
  projectId: string;
  userId: string;
  user: User;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TranslationMemory {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  matchPercentage?: number;
  projectId: string;
  createdAt: string;
}

export interface Glossary {
  id: string;
  term: string;
  definition?: string;
  translation?: string;
  category?: string;
  projectId: string;
  createdAt: string;
}

export interface AiTranslation {
  id: string;
  aiProvider: 'openai' | 'deepl' | 'google' | 'azure' | 'offline_model';
  modelName?: string;
  translatedText: string;
  confidenceScore?: number;
  segmentId: string;
  createdAt: string;
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
  createdAt: string;
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

// UI State types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

export interface SegmentState {
  segments: Segment[];
  currentSegment: Segment | null;
  isLoading: boolean;
  error: string | null;
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

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
}

// Filter and search types
export interface ProjectFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface SegmentFilters {
  search: string;
  status: string;
  translator: string;
  reviewer: string;
}

// Language options
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

// Theme types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Grid column definitions
export interface GridColumnDef {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filter?: boolean;
  editable?: boolean;
  cellRenderer?: any;
  valueFormatter?: (params: any) => string;
}

// API Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

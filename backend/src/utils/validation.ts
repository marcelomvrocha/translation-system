import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createError } from './errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if schema expects body directly or wrapped in body object
      const schemaKeys = Object.keys(schema.shape || {});
      if (schemaKeys.includes('body')) {
        // Schema expects { body, query, params } structure
        schema.parse({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else if (schemaKeys.includes('query')) {
        // Schema expects { query } structure (like paginationSchema)
        schema.parse({
          query: req.query,
        });
      } else {
        // Schema expects data directly (like bulkUpdateSegmentsSchema)
        schema.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(createError(message, 400));
      }
      next(error);
    }
  };
};

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    sourceLanguage: z.string().min(2, 'Source language is required'),
    targetLanguage: z.string().min(2, 'Target language is required'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').optional(),
    description: z.string().optional(),
    sourceLanguage: z.string().min(2, 'Source language is required').optional(),
    targetLanguage: z.string().min(2, 'Target language is required').optional(),
  }),
});

export const createSegmentSchema = z.object({
  body: z.object({
    segmentKey: z.string().min(1, 'Segment key is required'),
    sourceText: z.string().min(1, 'Source text is required'),
    targetText: z.string().optional(),
  }),
});

export const updateSegmentSchema = z.object({
  body: z.object({
    targetText: z.string().optional(),
    status: z.enum(['new', 'in_progress', 'translated', 'reviewed', 'approved']).optional(),
  }),
});

export const bulkUpdateSegmentsSchema = z.object({
  segments: z.array(z.object({
    id: z.string().uuid('Invalid segment ID'),
    targetText: z.string().optional(),
    status: z.enum(['new', 'in_progress', 'translated', 'reviewed', 'approved']).optional(),
  })).min(1, 'At least one segment is required'),
});

export const createCollaboratorSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['translator', 'reviewer', 'viewer'], {
      errorMap: () => ({ message: 'Role must be translator, reviewer, or viewer' }),
    }),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    type: z.enum(['segments', 'projects', 'users']).optional(),
  }),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    size: z.number().max(104857600, 'File size must be less than 100MB'), // 100MB
    buffer: z.instanceof(Buffer),
  }),
});

// AI translation validation
export const aiTranslationSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Text is required'),
    sourceLanguage: z.string().min(2, 'Source language is required'),
    targetLanguage: z.string().min(2, 'Target language is required'),
    provider: z.enum(['openai', 'deepl', 'google', 'azure', 'offline_model']).optional(),
    context: z.string().optional(),
  }),
});

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Language code validation
export const languageCodeSchema = z.string()
  .length(2, 'Language code must be 2 characters')
  .regex(/^[a-z]{2}$/, 'Language code must be lowercase letters');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Project ID validation
export const projectIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Segment ID validation
export const segmentIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// User ID validation
export const userIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Collaborator validation
export const addCollaboratorSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['translator', 'reviewer', 'viewer'], {
      errorMap: () => ({ message: 'Role must be translator, reviewer, or viewer' }),
    }),
  }),
});

export const updateCollaboratorRoleSchema = z.object({
  body: z.object({
    role: z.enum(['translator', 'reviewer', 'viewer'], {
      errorMap: () => ({ message: 'Role must be translator, reviewer, or viewer' }),
    }),
  }),
});

// Project search validation
export const projectSearchSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    search: z.string().optional(),
    status: z.enum(['active', 'in_progress', 'completed', 'archived']).optional(),
    sourceLanguage: z.string().length(2).optional(),
    targetLanguage: z.string().length(2).optional(),
  }),
});

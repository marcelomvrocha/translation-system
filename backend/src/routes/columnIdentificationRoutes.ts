import { Router } from 'express';
import { ColumnIdentificationController } from '@/controllers/columnIdentificationController';
import { authenticateToken } from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import { z } from 'zod';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const detectColumnsSchema = z.object({
  params: z.object({
    fileId: z.string().uuid('Invalid file ID')
  }),
  query: z.object({
    sheetName: z.string().optional(),
    maxSampleRows: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

const saveConfigurationSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    fileId: z.string().uuid('Invalid file ID')
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    sheetName: z.string().optional(),
    mappings: z.array(z.object({
      columnIndex: z.number().int().min(0),
      columnName: z.string().min(1),
      columnType: z.enum(['source', 'target', 'context', 'notes', 'status', 'key', 'skip']),
      languageCode: z.string().length(2).optional(),
      isRequired: z.boolean().optional(),
      customSettings: z.record(z.any()).optional()
    }))
  })
});

const getConfigurationSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    fileId: z.string().uuid('Invalid file ID')
  })
});

const parseWithConfigurationSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    fileId: z.string().uuid('Invalid file ID')
  }),
  body: z.object({
    configurationId: z.string().uuid('Invalid configuration ID')
  })
});

const deleteConfigurationSchema = z.object({
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    configurationId: z.string().uuid('Invalid configuration ID')
  })
});

// Routes
router.get(
  '/files/:fileId/columns',
  validateRequest(detectColumnsSchema),
  ColumnIdentificationController.detectColumns
);

router.post(
  '/projects/:projectId/files/:fileId/column-config',
  validateRequest(saveConfigurationSchema),
  ColumnIdentificationController.saveConfiguration
);

router.get(
  '/projects/:projectId/files/:fileId/column-config',
  validateRequest(getConfigurationSchema),
  ColumnIdentificationController.getConfiguration
);

router.post(
  '/projects/:projectId/files/:fileId/parse-with-config',
  validateRequest(parseWithConfigurationSchema),
  ColumnIdentificationController.parseWithConfiguration
);

router.get(
  '/presets',
  ColumnIdentificationController.getPresets
);

router.delete(
  '/projects/:projectId/column-configs/:configurationId',
  validateRequest(deleteConfigurationSchema),
  ColumnIdentificationController.deleteConfiguration
);

export default router;

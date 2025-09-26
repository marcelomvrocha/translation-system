import { Router } from 'express';
import { SegmentController } from '@/controllers/segmentController';
import { authenticate, requireProjectAccess, requireRole } from '@/middleware/auth';
import { 
  createSegmentSchema, 
  updateSegmentSchema,
  bulkUpdateSegmentsSchema,
  paginationSchema,
  validate 
} from '@/utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Segment CRUD routes
router.get('/project/:projectId',
  requireProjectAccess,
  validate(paginationSchema),
  SegmentController.getSegments
);

router.get('/:segmentId',
  SegmentController.getSegmentById
);

router.post('/project/:projectId',
  requireRole(['owner', 'translator']),
  validate(createSegmentSchema),
  SegmentController.createSegment
);

router.put('/:segmentId',
  validate(updateSegmentSchema),
  SegmentController.updateSegment
);

router.delete('/:segmentId',
  requireRole(['owner', 'translator']),
  SegmentController.deleteSegment
);

// Bulk operations
router.put('/project/:projectId/bulk',
  requireRole(['owner', 'translator', 'reviewer']),
  validate(bulkUpdateSegmentsSchema),
  SegmentController.bulkUpdateSegments
);

// Statistics
router.get('/project/:projectId/stats',
  requireProjectAccess,
  SegmentController.getSegmentStats
);

export default router;

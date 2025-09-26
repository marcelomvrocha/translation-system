import { Router } from 'express';
import { FileController } from '@/controllers/fileController';
import { authenticate } from '@/middleware/auth';
import { uploadSingle, uploadMultiple, handleUploadError } from '@/middleware/upload';
import { uploadLimiter } from '@/middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File upload routes
router.post('/upload/:projectId',
  uploadLimiter,
  uploadSingle('file'),
  handleUploadError,
  FileController.uploadFile
);

router.post('/upload-multiple/:projectId',
  uploadLimiter,
  uploadMultiple('files', 10),
  handleUploadError,
  FileController.uploadFile
);

// File management routes
router.get('/project/:projectId',
  FileController.getProjectFiles
);

router.get('/download/:fileId',
  FileController.downloadFile
);

router.delete('/:fileId',
  FileController.deleteFile
);

export default router;

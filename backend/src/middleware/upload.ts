import multer from 'multer';
import path from 'path';
import { createError } from '@/utils/errorHandler';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'text/plain',
    'application/json',
    'application/xml',
    'text/xml',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.apple.numbers', // Apple Numbers files
    'application/zip', // Numbers files are often detected as ZIP
    'application/x-iwork-numbers', // Alternative MIME type for Numbers
    'application/octet-stream' // Fallback for unknown types
  ];

  const allowedExtensions = [
    '.txt', '.json', '.xml', '.csv', '.pdf', 
    '.xlsx', '.xls', '.docx', '.odt',
    '.numbers' // Apple Numbers files
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isAllowedMimeType = allowedTypes.includes(file.mimetype);
  const isAllowedExtension = allowedExtensions.includes(fileExtension);

  // Allow if either MIME type or extension is allowed
  if (isAllowedMimeType || isAllowedExtension) {
    cb(null, true);
  } else {
    console.log('File rejected:', { 
      filename: file.originalname, 
      mimetype: file.mimetype, 
      extension: fileExtension 
    });
    cb(createError('Invalid file type. Only text, JSON, XML, CSV, PDF, Office documents, and Numbers files are allowed.', 400));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => 
  upload.array(fieldName, maxCount);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(createError('File too large. Maximum size is 100MB.', 413));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(createError('Too many files. Maximum is 10 files per request.', 413));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(createError('Unexpected field name for file upload.', 400));
    }
  }
  next(error);
};

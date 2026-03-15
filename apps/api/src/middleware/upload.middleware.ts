import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { FileStorageUtil } from '../utils/file-storage';

// Configure Multer storage engine
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // We expect projectId to be sent in the form-data before the file.
    // If it's missing (ordered incorrectly by client), we use a temp fallback folder.
    const projectId = req.body.projectId || 'temp_unassigned';
    
    // Ensure directory exists: uploads/imports/<projectId>/
    const dir = FileStorageUtil.generateFilePath(projectId);
    cb(null, dir);
  },
  filename: (req: Request, file, cb) => {
    // Generate a unique filename using our utility
    const fileName = FileStorageUtil.generateFileName(file.originalname);
    cb(null, fileName);
  },
});

// Define allowed file extensions
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    // Reject file
    cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`));
  }
};

// Export configured middleware
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Megabyte limit
  },
});

import express from 'express';
import multer from 'multer';
import { storageService } from '../services/storage';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST /upload - Upload PDF file
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a PDF file to upload' 
      });
    }

    const { originalname, path: tempPath } = req.file;

    // Upload to MongoDB GridFS
    const fileId = await storageService.uploadFile(tempPath, originalname);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    res.json({
      success: true,
      fileId,
      fileName: originalname,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// GET /upload/:fileId - Download/View PDF file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Get file info
    const fileInfo = await storageService.getFileInfo(fileId);
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Download file buffer
    const fileBuffer = await storageService.downloadFile(fileId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
      'Content-Length': fileBuffer.length.toString(),
    });

    res.send(fileBuffer);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// DELETE /upload/:fileId - Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const success = await storageService.deleteFile(fileId);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        error: 'File not found or could not be deleted' 
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
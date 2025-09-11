import express from 'express';
import pdf from 'pdf-parse';
import { aiService, AIModel } from '../services/ai';
import { storageService } from '../services/storage';
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();


async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    return data.text.trim();
  } catch (error) {
    throw new Error('Failed to extract text from PDF');
  }
}


router.post('/', async (req, res) => {
  try {
    const { fileId, model } = req.body;

    
    if (!fileId || !model) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fileId and model are required'
      });
    }

    if (model !== 'gemini') {
      return res.status(400).json({
        error: 'Invalid model',
        message: 'model must be "gemini"'
      });
    }

    
    const fileInfo = await storageService.getFileInfo(fileId);
    if (!fileInfo) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    const pdfBuffer = await storageService.downloadFile(fileId);
    
    
    const pdfText = await extractTextFromPDF(pdfBuffer);
    
    if (!pdfText || pdfText.length < 10) {
      return res.status(400).json({
        error: 'PDF text extraction failed',
        message: 'Could not extract readable text from the PDF'
      });
    }

    
    const extractedData = await aiService.extractData(pdfText, model as AIModel);

    // Return extracted data with file 
    
    res.json({
      success: true,
      data: {
        fileId,
        fileName: fileInfo.filename,
        ...extractedData
      },
      model: model,
      message: `Data extracted successfully using ${model}`
    });

  } catch (error) {
    console.error('Extraction error:', error);
    
    let statusCode = 500;
    let message = 'Extraction failed';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        statusCode = 401;
        message = 'AI service not configured properly';
      } else if (error.message.includes('extract text')) {
        statusCode = 400;
        message = 'Could not process PDF file';
      } else {
        message = error.message;
      }
    }

    res.status(statusCode).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : error : undefined
    });
  }
});


router.post('/test', async (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text || !model) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'text and model are required'
      });
    }

    if (model !== 'gemini') {
      return res.status(400).json({
        error: 'Invalid model',
        message: 'model must be "gemini"'
      });
    }

    const extractedData = await aiService.extractData(text, model as AIModel);

    res.json({
      success: true,
      data: extractedData,
      model: model,
      message: `Test extraction completed using ${model}`
    });

  } catch (error) {
    console.error('Test extraction error:', error);
    res.status(500).json({
      error: 'Test extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
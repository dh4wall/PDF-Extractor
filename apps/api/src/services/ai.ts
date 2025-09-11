import { GoogleGenerativeAI } from '@google/generative-ai';
import { Invoice } from '../models/Invoice';
import dotenv from 'dotenv';
dotenv.config();

export type AIModel = 'gemini';

class AIService {
  private gemini: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  private getExtractionPrompt(): string {
    return `Extract invoice data from the provided text and return ONLY valid JSON in this exact format:
{
  "vendor": {
    "name": "string",
    "address": "string (optional)",
    "taxId": "string (optional)"
  },
  "invoice": {
    "number": "string",
    "date": "string (YYYY-MM-DD)",
    "currency": "string (optional, e.g., USD)",
    "subtotal": number,
    "taxPercent": number,
    "total": number,
    "poNumber": "string (optional)",
    "poDate": "string (optional, YYYY-MM-DD)",
    "lineItems": [
      {
        "description": "string",
        "unitPrice": number,
        "quantity": number,
        "total": number
      }
    ]
  }
}

Important:
- Return ONLY the JSON object, no other text
- Use null for missing optional fields
- Ensure all numbers are numeric, not strings
- If you cannot find certain information, use reasonable defaults or null`;
  }

  async extractWithGemini(pdfText: string): Promise<Partial<Invoice>> {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const prompt = `${this.getExtractionPrompt()}\n\nPDF Content:\n${pdfText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      return {
        vendor: parsed.vendor,
        invoice: parsed.invoice
      };
    } catch (error) {
      console.error('Gemini extraction error:', error);
      throw new Error('Failed to extract data with Gemini');
    }
  }

  async extractData(pdfText: string, model: AIModel): Promise<Partial<Invoice>> {
    if (model !== 'gemini') {
      throw new Error('Invalid AI model specified');
    }
    return await this.extractWithGemini(pdfText);
  }
}

export const aiService = new AIService();
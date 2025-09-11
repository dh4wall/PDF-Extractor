import express from 'express';
import { db } from '../services/database';
import { CreateInvoiceRequest, UpdateInvoiceRequest } from '../models/Invoice';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const searchQuery = q ? { q: q as string } : undefined;
    
    const invoices = await db.getInvoices(searchQuery);
    
    res.json({
      success: true,
      data: invoices,
      count: invoices.length,
      query: searchQuery?.q || null
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: 'Failed to retrieve invoices',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Please provide a valid invoice ID'
      });
    }

    const invoice = await db.getInvoiceById(id);
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        message: 'The requested invoice does not exist'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      error: 'Failed to retrieve invoice',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});


router.post('/', async (req, res) => {
  try {
    const invoiceData: CreateInvoiceRequest = req.body;

    
    if (!invoiceData.fileId || !invoiceData.fileName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fileId and fileName are required'
      });
    }

    if (!invoiceData.vendor?.name) {
      return res.status(400).json({
        error: 'Missing vendor information',
        message: 'Vendor name is required'
      });
    }

    if (!invoiceData.invoice?.number) {
      return res.status(400).json({
        error: 'Missing invoice information',
        message: 'Invoice number is required'
      });
    }

    
    const invoiceId = await db.createInvoice({
      fileId: invoiceData.fileId,
      fileName: invoiceData.fileName,
      vendor: invoiceData.vendor,
      invoice: {
        ...invoiceData.invoice,
        lineItems: invoiceData.invoice.lineItems || []
      },
      createdAt: new Date().toISOString()
    });

    
    const createdInvoice = await db.getInvoiceById(invoiceId);

    res.status(201).json({
      success: true,
      data: createdInvoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateInvoiceRequest = req.body;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Please provide a valid invoice ID'
      });
    }

    
    const existingInvoice = await db.getInvoiceById(id);
    if (!existingInvoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        message: 'The invoice to update does not exist'
      });
    }

    
    const success = await db.updateInvoice(id, updateData);
    
    if (!success) {
      return res.status(400).json({
        error: 'Update failed',
        message: 'Could not update the invoice'
      });
    }

    
    const updatedInvoice = await db.getInvoiceById(id);

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice updated successfully'
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      error: 'Failed to update invoice',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Please provide a valid invoice ID'
      });
    }

    
    const existingInvoice = await db.getInvoiceById(id);
    if (!existingInvoice) {
      return res.status(404).json({
        error: 'Invoice not found',
        message: 'The invoice to delete does not exist'
      });
    }

    
    const success = await db.deleteInvoice(id);
    
    if (!success) {
      return res.status(400).json({
        error: 'Delete failed',
        message: 'Could not delete the invoice'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      error: 'Failed to delete invoice',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
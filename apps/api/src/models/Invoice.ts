import { ObjectId } from 'mongodb';

export interface LineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Vendor {
  name: string;
  address?: string;
  taxId?: string;
}

export interface InvoiceDetails {
  number: string;
  date: string;
  currency?: string;
  subtotal?: number;
  taxPercent?: number;
  total?: number;
  poNumber?: string;
  poDate?: string;
  lineItems: LineItem[];
}

export interface Invoice {
  _id?: ObjectId; // Changed from string to ObjectId
  fileId: string;
  fileName: string;
  vendor: Vendor;
  invoice: InvoiceDetails;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInvoiceRequest {
  fileId: string;
  fileName: string;
  vendor: Vendor;
  invoice: InvoiceDetails;
}

export interface UpdateInvoiceRequest {
  vendor?: Vendor;
  invoice?: InvoiceDetails;
}
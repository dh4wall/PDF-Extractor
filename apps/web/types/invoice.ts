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
  _id?: string;
  fileId: string;
  fileName: string;
  vendor: Vendor;
  invoice: InvoiceDetails;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  message: string;
}

export interface ExtractResponse {
  success: boolean;
  data: Partial<Invoice>;
  model: string;
  message: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
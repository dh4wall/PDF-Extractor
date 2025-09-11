import { Invoice, UploadResponse, ExtractResponse, APIResponse } from '@/types/invoice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

class APIClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: 'Request failed',
        message: response.statusText 
      }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  // File upload
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  // AI extraction
  async extractData(fileId: string, model: 'gemini' | 'groq'): Promise<ExtractResponse> {
    return this.request<ExtractResponse>('/extract', {
      method: 'POST',
      body: JSON.stringify({ fileId, model }),
    });
  }

  // Get all invoices
  async getInvoices(search?: string): Promise<APIResponse<Invoice[]>> {
    const params = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request<APIResponse<Invoice[]>>(`/invoices${params}`);
  }

  // Get single invoice
  async getInvoice(id: string): Promise<APIResponse<Invoice>> {
    return this.request<APIResponse<Invoice>>(`/invoices/${id}`);
  }

  // Create invoice
  async createInvoice(invoice: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Invoice>> {
    return this.request<APIResponse<Invoice>>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<APIResponse<Invoice>> {
    return this.request<APIResponse<Invoice>>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<APIResponse> {
    return this.request<APIResponse>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Get file URL for PDF viewing
  getFileUrl(fileId: string): string {
    return `${API_BASE_URL}/upload/${fileId}`;
  }
}

export const api = new APIClient();
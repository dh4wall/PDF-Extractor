'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Invoice } from '@/types/invoice';
import { Upload, Bot, Save, Trash2, FileText, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading PDF Viewer...</p>
      </div>
    </div>
  )
});


const CustomLoader = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="relative">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 dark:border-gray-400 border-t-transparent"></div>
      <div className="absolute inset-0 animate-pulse rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 opacity-50"></div>
    </div>
    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Processing...</span>
  </div>
);


const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 transform ${
      type === 'success' ? 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-700'
    }`}>
      {type === 'success' ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
      <span className={`text-sm font-medium ${type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
        {message}
      </span>
      <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [extractedData, setExtractedData] = useState<Partial<Invoice> | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorTaxId, setVendorTaxId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [taxPercent, setTaxPercent] = useState<number | ''>('');
  const [total, setTotal] = useState<number | ''>('');
  const [poNumber, setPoNumber] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFileId(null);
      setExtractedData(null);
      setShowPDFViewer(true);
      clearForm();
    } else {
      showToast('Please select a valid PDF file', 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const response = await api.uploadFile(selectedFile);
      setFileId(response.fileId);
      setFileName(response.fileName);
      showToast('File uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!fileId) return;

    try {
      setExtracting(true);
      const response = await api.extractData(fileId, 'gemini');
      setExtractedData(response.data);
      
      if (response.data.vendor) {
        setVendorName(response.data.vendor.name || '');
        setVendorAddress(response.data.vendor.address || '');
        setVendorTaxId(response.data.vendor.taxId || '');
      }
      
      if (response.data.invoice) {
        setInvoiceNumber(response.data.invoice.number || '');
        setInvoiceDate(response.data.invoice.date || '');
        setCurrency(response.data.invoice.currency || 'USD');
        setSubtotal(response.data.invoice.subtotal || '');
        setTaxPercent(response.data.invoice.taxPercent || '');
        setTotal(response.data.invoice.total || '');
        setPoNumber(response.data.invoice.poNumber || '');
      }
      showToast('Data extracted successfully!', 'success');
    } catch (error) {
      console.error('Extraction failed:', error);
      showToast('Failed to extract data: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!fileId || !fileName) return;

    try {
      setSaving(true);
      
      const invoiceData: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'> = {
        fileId,
        fileName,
        vendor: {
          name: vendorName,
          address: vendorAddress || undefined,
          taxId: vendorTaxId || undefined,
        },
        invoice: {
          number: invoiceNumber,
          date: invoiceDate,
          currency: currency || undefined,
          subtotal: typeof subtotal === 'number' ? subtotal : undefined,
          taxPercent: typeof taxPercent === 'number' ? taxPercent : undefined,
          total: typeof total === 'number' ? total : undefined,
          poNumber: poNumber || undefined,
          poDate: undefined,
          lineItems: extractedData?.invoice?.lineItems || [],
        },
      };

      await api.createInvoice(invoiceData);
      showToast('Invoice saved successfully!', 'success');
      
      setSelectedFile(null);
      setFileId(null);
      setExtractedData(null);
      setShowPDFViewer(false);
      clearForm();
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Failed to save invoice: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setVendorName('');
    setVendorAddress('');
    setVendorTaxId('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setCurrency('USD');
    setSubtotal('');
    setTaxPercent('');
    setTotal('');
    setPoNumber('');
  };

  const togglePDFViewer = () => {
    setShowPDFViewer(!showPDFViewer);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Conditionally hide the title when fileId exists (PDF is open) */}
        {!fileId && (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">PDF Invoice Dashboard</h1>
          </div>
        )}
        {fileId && (
          <div className="flex items-center justify-end mb-6">
            <Button
              variant="outline"
              onClick={togglePDFViewer}
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 rounded-lg"
            >
              {showPDFViewer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPDFViewer ? 'Hide PDF' : 'Show PDF'}
            </Button>
          </div>
        )}

        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Show upload card only if no file is uploaded */}
        {!fileId && (
          <Card className="max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                Upload PDF Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="mb-4 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a PDF invoice file to upload and process
                  </p>
                </div>
                
                {selectedFile && (
                  <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={loading || !!fileId}
                      size="sm"
                      className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white transition-colors duration-200 rounded-lg"
                    >
                      {loading ? <CustomLoader /> : 'Upload'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show PDF viewer and form in two-column layout after upload */}
        {fileId && (
          <div className="flex min-h-[calc(100vh-8rem)] gap-6">
            {/* Left Column - PDF Viewer (Sticky) */}
            {showPDFViewer && (
              <div className="w-1/2 fixed top-20 left-0 h-[calc(100vh-5rem)]">
                <PDFViewer 
                  fileUrl={api.getFileUrl(fileId)}
                  fileName={fileName}
                  className="h-full w-full"
                />
              </div>
            )}
            {/* Right Column - Controls and Form (Scrollable) */}
            <div className={`w-full ${showPDFViewer ? 'lg:ml-[50%] pl-6' : ''}`}>
              <div className="space-y-6">
                <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Bot className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      AI Data Extraction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use AI to automatically extract invoice data from your PDF
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleExtract}
                          disabled={extracting}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white transition-colors duration-200 rounded-lg"
                        >
                          {extracting ? <CustomLoader /> : (
                            <>
                              <Bot className="h-4 w-4 mr-2 text-gray-200 dark:text-gray-300" />
                              Extract with Gemini AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Invoice Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b pb-2">
                        Vendor Information
                      </h4>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Vendor Name *"
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200 ${
                            !vendorName ? 'border-gray-400 dark:border-gray-500 focus:border-gray-500 dark:focus:border-gray-400' : ''
                          }`}
                        />
                        <Input
                          placeholder="Vendor Address"
                          value={vendorAddress}
                          onChange={(e) => setVendorAddress(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                        />
                        <Input
                          placeholder="Tax ID / VAT Number"
                          value={vendorTaxId}
                          onChange={(e) => setVendorTaxId(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b pb-2">
                        Invoice Information
                      </h4>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Invoice Number *"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className={`bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200 ${
                            !invoiceNumber ? 'border-gray-400 dark:border-gray-500 focus:border-gray-500 dark:focus:border-gray-400' : ''
                          }`}
                        />
                        <Input
                          type="date"
                          placeholder="Invoice Date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                        />
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg">
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Subtotal"
                            value={subtotal}
                            onChange={(e) => setSubtotal(e.target.value ? parseFloat(e.target.value) : '')}
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Tax %"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(e.target.value ? parseFloat(e.target.value) : '')}
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Total"
                            value={total}
                            onChange={(e) => setTotal(e.target.value ? parseFloat(e.target.value) : '')}
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                          />
                        </div>
                        <Input
                          placeholder="Purchase Order Number"
                          value={poNumber}
                          onChange={(e) => setPoNumber(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button
                        onClick={handleSave}
                        disabled={saving || !vendorName || !invoiceNumber}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
                      >
                        {saving ? <CustomLoader /> : (
                          <>
                            <Save className="h-4 w-4 mr-2 text-gray-200 dark:text-gray-300" />
                            Save Invoice
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearForm}
                        className="px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Invoice } from '@/types/invoice';
import { formatDate, formatCurrency, debounce } from '@/lib/utils';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = debounce((query: string) => {
    fetchInvoices(query);
  }, 300);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      fetchInvoices();
    }
  }, [searchQuery]);

  const fetchInvoices = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getInvoices(search);
      setInvoices(response.data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoices';
      console.error('Failed to fetch invoices:', error);
      setError(errorMessage);
      toast.error('Failed to fetch invoices', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast("Are you sure you want to delete this invoice?", {
      action: {
        label: "Delete",
        onClick: () => {
          const promise = api.deleteInvoice(id).then(() => {
            setInvoices(currentInvoices =>
              currentInvoices.filter(invoice => invoice._id !== id)
            );
          });

          toast.promise(promise, {
            loading: "Deleting invoice...",
            success: "Invoice deleted successfully!",
            error: (err) => `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        },
      },
      cancel: {
        label: "Cancel",
        // The onClick is required by the type, even if it does nothing.
        // Sonner handles the dismissal automatically.
        onClick: () => {},
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your extracted invoice records
            </p>
          </div>
          <Link href="/dashboard">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by vendor name or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading invoices...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-destructive">
                <p className="text-lg font-medium">Error Loading Invoices</p>
                <p className="text-sm mt-2">{error}</p>
                <Button 
                  onClick={() => fetchInvoices()}
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-muted-foreground">
                      {searchQuery ? 'No invoices found' : 'No invoices yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery 
                        ? 'Try adjusting your search terms'
                        : 'Upload and extract your first PDF invoice'
                      }
                    </p>
                    {!searchQuery && (
                      <Link href="/dashboard">
                        <Button className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Invoice
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
                </p>
                
                {invoices.map((invoice) => (
                  <Card key={invoice._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {invoice.vendor.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Invoice #{invoice.invoice.number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {invoice.invoice.total 
                                  ? formatCurrency(invoice.invoice.total, invoice.invoice.currency)
                                  : 'N/A'
                                }
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(invoice.invoice.date)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">File</p>
                              <p className="font-medium truncate">{invoice.fileName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Currency</p>
                              <p className="font-medium">{invoice.invoice.currency || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">PO Number</p>
                              <p className="font-medium">{invoice.invoice.poNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">{formatDate(invoice.createdAt)}</p>
                            </div>
                          </div>

                          {invoice.vendor.address && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">
                                {invoice.vendor.address}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(api.getFileUrl(invoice.fileId), '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(invoice._id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {invoice.invoice.lineItems && invoice.invoice.lineItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Line Items ({invoice.invoice.lineItems.length})</p>
                          <div className="space-y-1">
                            {invoice.invoice.lineItems.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="truncate">{item.description}</span>
                                <span className="ml-2">
                                  {item.quantity} × {formatCurrency(item.unitPrice, invoice.invoice.currency)} = {formatCurrency(item.total, invoice.invoice.currency)}
                                </span>
                              </div>
                            ))}
                            {invoice.invoice.lineItems.length > 3 && (
                              <p className="text-sm text-muted-foreground">
                                +{invoice.invoice.lineItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

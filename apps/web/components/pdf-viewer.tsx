'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  className?: string;
}

export function PDFViewer({ fileUrl, fileName, className }: PDFViewerProps) {
  const [totalPages, setTotalPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setTotalPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error loading PDF document:', error);
    setError('Failed to load PDF file.');
    setLoading(false);
  }

  const goToPrevPage = () => setPageNum(p => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNum(p => Math.min(p + 1, totalPages));
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 2.5));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Card className={`flex flex-col ${className} bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNum <= 1}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {pageNum} of {totalPages || '--'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNum >= totalPages}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ZoomOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ZoomIn className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <Download className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : <Maximize2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div
        ref={viewerRef}
        className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-700 p-4"
      >
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Error Loading PDF</p>
            <p className="text-sm mt-2">{error}</p>
            <Button
              variant="outline"
              className="mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {!error && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 dark:border-gray-400"></div>
                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading PDF...</span>
              </div>
            }
          >
            <Page
              pageNumber={pageNum}
              scale={scale}
              renderAnnotationLayer={true}
              renderTextLayer={true}
              className="mx-auto"
            />
          </Document>
        )}
      </div>
    </Card>
  );
}
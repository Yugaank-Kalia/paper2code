"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";

export function PDFViewer({ base64Pdf }: { base64Pdf: string }) {
  // Configure the worker inside the component to avoid server-side evaluation
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Viewer controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-6 bg-background/50 backdrop-blur-md border border-border/60 p-2 sm:p-3 rounded-xl shadow-sm sticky top-20 z-10 w-full max-w-2xl">
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium tabular-nums min-w-25 text-center">
          Page {pageNumber} of {numPages || "--"}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer"
          onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))}
          disabled={pageNumber >= (numPages || 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="hidden sm:block w-px h-6 bg-border mx-2" />

        <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => setScale(s => s - 0.2)} disabled={scale <= 0.4}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
        <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => setScale(s => s + 0.2)} disabled={scale >= 3.0}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Document Container */}
      <div className="max-w-full overflow-x-auto bg-black/5 dark:bg-white/5 border border-border rounded-xl p-2 sm:p-6 shadow-2xl flex justify-center w-full min-h-150 items-start transition-all">
        <Document
          file={`data:application/pdf;base64,${base64Pdf}`}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-125 w-full text-muted-foreground gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Loading document...</p>
            </div>
          }
          className="flex flex-col items-center"
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            loading={
              <div className="h-200 w-150 flex items-center justify-center bg-white/50 animate-pulse rounded-md" />
            }
            className="shadow-md rounded-md overflow-hidden bg-white mx-auto"
          />
        </Document>
      </div>
    </div>
  );
}

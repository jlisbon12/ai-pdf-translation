import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import {
  AlertCircle,
  PlusCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const [scale, setScale] = React.useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: any) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF document.");
  };

  const zoomIn = () =>
    setScale((prevScale) =>
      prevScale < 2.0 ? parseFloat((prevScale + 0.1).toFixed(1)) : prevScale
    );
  const zoomOut = () =>
    setScale((prevScale) =>
      prevScale > 0.5 ? parseFloat((prevScale - 0.1).toFixed(1)) : prevScale
    );

  const goToPrevPage = () =>
    setPageNumber((prevPageNumber) =>
      prevPageNumber > 1 ? prevPageNumber - 1 : prevPageNumber
    );

  const goToNextPage = () =>
    setPageNumber((prevPageNumber) =>
      prevPageNumber < (numPages ?? 0) ? prevPageNumber + 1 : prevPageNumber
    );

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-full bg-slate-200 relative">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col items-center">
          <Document
            file={pdf_url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              scale={scale}
            />
          </Document>
          <div className="absolute bottom-4 flex space-x-4 bg-slate-900 px-20 py-2 rounded-md">
            <Button onClick={zoomOut} variant="outline" disabled={scale <= 0.5}>
              <MinusCircle className="h-4 w-4" />
            </Button>
            <div className="flex flex-row space-x-2">
              <div className="bg-sky-700 rounded-s-sm px-2">
                <p className="pt-2 text-white">Zoom</p>
              </div>
              <div className="bg-sky-700 rounded-e-sm px-2">
                <p className="pt-2 text-white">{scale.toFixed(1)}</p>
              </div>
            </div>
            <Button onClick={zoomIn} variant="outline" disabled={scale >= 2.0}>
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              onClick={goToPrevPage}
              variant="outline"
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="bg-sky-700 rounded-sm px-4">
              <p className="pt-2 text-white">{pageNumber}</p>
            </div>
            <Button
              onClick={goToNextPage}
              variant="outline"
              disabled={pageNumber >= (numPages ?? 0)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;

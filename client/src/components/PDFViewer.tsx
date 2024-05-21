import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  const [numPages, setNumPages] = React.useState(null);
  const [error, setError] = React.useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: any) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: any) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF document.");
  };

  return (
    <div className="w-full h-full">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Document
          file={pdf_url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
          ))}
        </Document>
      )}
    </div>
  );
};

export default PDFViewer;

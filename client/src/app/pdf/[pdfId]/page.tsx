"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import PDFViewer from "@/components/PDFViewer";
import SideBar from "@/components/SideBar";
import { Button } from "@/components/ui/button";
import { FileScan } from "lucide-react";
import OCRProcess from "@/components/OCRProcess";

interface PDFData {
  pdf_url: string;
  file_key: string;
  file_name: string;
  upload_time: Date;
}

const PDFPage = () => {
  const router = useRouter();
  const { pdfId } = useParams();
  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  useEffect(() => {
    if (!pdfId) {
      return;
    }

    const fetchPDFData = async () => {
      try {
        const response = await axios.get(`/api/get-pdf/${pdfId}`);
        setPdfData(response.data);
      } catch (error) {
        setError("Error fetching PDF data");
      } finally {
        setLoading(false);
      }
    };

    fetchPDFData();
  }, [pdfId]);

  const handleOcrProcess = async () => {
    if (!pdfData) {
      return;
    }

    try {
      const response = await axios.post("/api/create-process", {
        file_key: pdfData.file_key,
        file_name: pdfData.file_name,
      });
      setOcrData(response.data);
      setIsOcrOpen(true);
    } catch (error) {
      setError("Error processing OCR");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!pdfData) {
    return <p>No PDF data found</p>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex w-full max-h-screen overflow-scroll">
        <div className="flex max-w-xs">
          <SideBar />
        </div>
        <div className="max-h-screen overflow-scroll flex-[5] relative">
          <PDFViewer pdf_url={pdfData.pdf_url || ""} />
          <Button onClick={handleOcrProcess} className="absolute top-4 right-4">
            Process OCR
            <FileScan className="ml-2 h-6 w-6" />
          </Button>
        </div>
        {ocrData && (
          <div className="absolute">
            <OCRProcess
              isOpen={isOcrOpen}
              onClose={() => setIsOcrOpen(false)}
              ocrData={ocrData}
              fileKey={pdfData.file_key}
              fileName={pdfData.file_name}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFPage;

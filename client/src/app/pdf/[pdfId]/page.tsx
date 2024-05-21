"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import PDFViewer from "@/components/PDFViewer";
import SideBar from "@/components/SideBar";

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
        <div className="max-h-screen p-4 oveflow-scroll flex-[5]">
          <PDFViewer pdf_url={pdfData.pdf_url || ""} />
        </div>
      </div>
    </div>
  );
};

export default PDFPage;

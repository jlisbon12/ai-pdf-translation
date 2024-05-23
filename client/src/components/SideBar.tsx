import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { File, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface PDF {
  file_key: string;
  file_name: string;
  upload_time: Date;
}

const fetchPDFs = async (): Promise<PDF[]> => {
  const { data } = await axios.get<PDF[]>("/api/get-pdfs");
  return data;
};

const SideBar = () => {
  const {
    data: pdfs = [],
    error,
    isLoading,
  } = useQuery<PDF[], Error>({
    queryKey: ["pdfs"],
    queryFn: fetchPDFs,
  });

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve selected PDF key from local storage
    const storedKey = localStorage.getItem("selectedPDFKey");
    if (storedKey) {
      setSelectedKey(storedKey);
    }
  }, []);

  const handlePDFClick = (key: string) => {
    // Store selected PDF key in local storage
    localStorage.setItem("selectedPDFKey", key);
    setSelectedKey(key);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading PDFs</p>;

  return (
    <div className="w-full max-h-screen overflow-scroll p-4 text-slate-200 bg-slate-900">
      <Link href="/">
        <Button className="w-full border-dashed border-white border">
          <PlusCircle className="mr-2 w-4 h-4" />
          New PDF
        </Button>
      </Link>
      <div className="flex max-h-screen overflow-scroll pb-20 flex-col gap-2 mt-4">
        {pdfs.map((pdf: PDF) => (
          <Link
            key={pdf.file_key}
            href={`/pdf/${pdf.file_key}`}
            onClick={() => handlePDFClick(pdf.file_key)}
          >
            <div
              className={cn("rounded-lg p-3 text-slate-300 flex items-center", {
                "bg-sky-600 text-white": pdf.file_key === selectedKey,
                "hover:text-white": pdf.file_key !== selectedKey,
              })}
            >
              <File className="mr-2" />
              <p className="w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis">
                {pdf.file_name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SideBar;

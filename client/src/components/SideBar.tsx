import React from "react";
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
    data: pdfs = [], // Default to an empty array
    error,
    isLoading,
  } = useQuery<PDF[], Error>({
    queryKey: ["pdfs"],
    queryFn: fetchPDFs,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading PDFs</p>;

  return (
    <div className="w-full max-h-screen overflow-scroll soff p-4 text-gray-200 bg-gray-900">
      <Link href="/">
        <Button className="w-full border-dashed border-white border">
          <PlusCircle className="mr-2 w-4 h-4" />
          New PDF
        </Button>
      </Link>
      <div className="flex max-h-scren overflow-scroll pb-20 flex-col gap-2 mt-4">
        {pdfs.map((pdf: PDF) => (
          <Link key={pdf.file_key} href={`/pdf/${pdf.file_key}`}>
            <div
              className={cn("rounded-lg p-3 text-slate-300 flex items-center", {
                "bg-blue-600 text-white": pdf.file_key == pdf.file_key,
                "hover:text-white": pdf.file_key !== pdf.file_key,
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

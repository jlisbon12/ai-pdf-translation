"use client";

import { Button } from "@/components/ui/button";
import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PDF {
  file_key: string;
  file_name: string;
  upload_time: Date;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await axios.get("/api/get-pdfs");
        setPdfs(response.data);
      } catch (error) {
        console.error("Error fetching PDFs:", error);
      }
    };

    if (isSignedIn) {
      fetchPdfs();
    }
  }, [isSignedIn]);

  const handleGoToPdfs = () => {
    if (pdfs.length > 0) {
      router.push(`/pdf/${pdfs[0].file_key}`);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-tr from-violet-500 to-orange-300">
      <div className="flex justify-end">
        <div className="mt-4 mr-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold text-white">
              Translate Any PDF
            </h1>
          </div>

          <div className="flex mt-2">
            {isSignedIn && (
              <Button onClick={handleGoToPdfs}>
                Go to PDFs <ArrowRight className="ml-2" />
              </Button>
            )}
          </div>

          <p className="max-w-xl mt-1 text-lg text-gray-700">
            Have any information from research papers to letters you need to be
            easily translated with AI
          </p>

          <div className="w-full mt-4">
            {isSignedIn ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to get Started! <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

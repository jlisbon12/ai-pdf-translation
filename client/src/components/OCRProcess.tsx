"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "react-hot-toast";
import iso6391 from "iso-639-1";

interface OCRProcessProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: {
    ocrResults: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    originalLanguage: string;
    images: Array<string>;
  };
  fileKey: string;
  fileName: string;
}

const OCRProcess = ({
  isOpen,
  onClose,
  ocrData,
  fileKey,
  fileName,
}: OCRProcessProps) => {
  const canvasRef = useRef<HTMLCanvasElement[]>([]);
  const [originalLanguage] = useState(ocrData.originalLanguage);
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedData, setTranslatedData] = useState<any[]>([]);
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current[currentPage];
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const image = new Image();
      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        ocrData.ocrResults.forEach((result) => {
          const vertices = result.boundingPoly.vertices;
          if (vertices.length === 4) {
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";
            ctx.stroke();
          }
        });
      };
      image.src = ocrData.images[currentPage];
    }

    // Set the initial display text to the original OCR results
    setDisplayText(ocrData.ocrResults.map((result) => result.description));
  }, [ocrData, currentPage]);

  useEffect(() => {
    if (translatedData.length > 0) {
      const canvas = canvasRef.current[currentPage];
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          translatedData[currentPage].forEach(
            (item: {
              boundingPoly: { vertices: any };
              description: string;
            }) => {
              const vertices = item.boundingPoly.vertices;
              if (vertices.length === 4) {
                const width = vertices[1].x - vertices[0].x;
                const height = vertices[3].y - vertices[0].y;

                ctx.fillStyle = "white";
                ctx.fillRect(vertices[0].x, vertices[0].y, width, height);

                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let i = 1; i < vertices.length; i++) {
                  ctx.lineTo(vertices[i].x, vertices[i].y);
                }
                ctx.closePath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "red";
                ctx.stroke();

                ctx.fillStyle = "blue";
                ctx.font = "12px Arial";
                ctx.textBaseline = "top";
                ctx.fillText(
                  item.description,
                  vertices[0].x + 2,
                  vertices[0].y + 2
                );
              }
            }
          );
        };
        image.src = ocrData.images[currentPage];
      }
    }
  }, [translatedData, currentPage, ocrData]);

  const handleTranslate = async () => {
    try {
      const response = await axios.post("/api/create-translation", {
        file_key: fileKey,
        file_name: fileName,
        ocrData,
        targetLanguage,
      });
      toast.success("Translation completed successfully");
      setTranslatedData(response.data.translations);
      setDisplayText(
        response.data.translations.map(
          (item: { description: any }) => item.description
        )
      );
    } catch (error) {
      toast.error("Error translating file");
      console.error("Error translating file:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-full flex flex-col overflow-auto">
        <DialogHeader className="flex flex-row w-full mt-4">
          <DialogTitle>OCR Process Results</DialogTitle>
        </DialogHeader>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <div className="flex flex-row justify-center items-center space-x-3 bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-md font-semibold text-nowrap bg-white px-4 py-1 rounded-md border-gray-200 border">
              Original Language
            </span>
            <div className="rounded w-40">
              <span className="text-[14px] pl-2 pb-4">
                {iso6391.getName(originalLanguage)}
              </span>
            </div>
          </div>

          <div className="flex flex-row justify-center items-center space-x-3 bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-md font-semibold text-nowrap bg-white px-4 py-1 rounded-md border-gray-200 border">
              Target Language
            </span>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-40 h-[30px] py-4 border-none bg-transparent">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="py-6 px-4" onClick={handleTranslate}>
            Translate
          </Button>
        </div>
        <div className="flex flex-row h-full w-full">
          <div className="w-[50%] h-[100%] flex-1 flex-col p-4 justify-center items-center">
            <canvas
              ref={(el) => {
                if (el) canvasRef.current[currentPage] = el;
              }}
              className="max-w-full max-h-full border border-gray-300"
            />
            <Pagination
              className="flex flex-start translate-x-[12rem] my-4"
              currentPage={currentPage + 1}
              totalPages={ocrData.images.length}
              onPageChange={(page: number) => setCurrentPage(page - 1)}
            />
          </div>
          <ScrollArea className="flex-1 p-4 h-full">
            <h2 className="text-xl font-semibold mb-4">OCR Text</h2>
            {displayText.length > 0 ? (
              displayText.map((text, index) => <p key={index}>{text}</p>)
            ) : (
              <p>{ocrData.ocrResults[0].description}</p>
            )}
          </ScrollArea>
        </div>

        <Button onClick={onClose} className="mt-10">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OCRProcess;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <Button onClick={handlePrevious} disabled={currentPage === 1}>
        Previous
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button onClick={handleNext} disabled={currentPage === totalPages}>
        Next
      </Button>
    </div>
  );
};

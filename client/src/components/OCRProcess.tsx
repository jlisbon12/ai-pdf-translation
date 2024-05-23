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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState(
    ocrData.originalLanguage
  );
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedData, setTranslatedData] = useState<any[]>([]);

  useEffect(() => {
    if (ocrData.images.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        const image = new Image();
        image.onload = () => {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          ocrData.ocrResults.slice(1).forEach((result) => {
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
        image.src = ocrData.images[0];
      }
    }
  }, [ocrData]);

  useEffect(() => {
    if (translatedData.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw the image
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          translatedData.slice(1).forEach((item) => {
            const vertices = item.boundingPoly.vertices;
            if (vertices.length === 4) {
              // Calculate width and height of the box
              const width = vertices[1].x - vertices[0].x;
              const height = vertices[3].y - vertices[0].y;

              // Clear the box area
              ctx.fillStyle = "white";
              ctx.fillRect(vertices[0].x, vertices[0].y, width, height);

              // Draw the bounding box
              ctx.beginPath();
              ctx.moveTo(vertices[0].x, vertices[0].y);
              for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
              }
              ctx.closePath();
              ctx.lineWidth = 2;
              ctx.strokeStyle = "red";
              ctx.stroke();

              // Draw the text inside the box
              ctx.fillStyle = "blue"; // Set text color
              ctx.font = "12px Arial"; // Set font size and family
              ctx.textBaseline = "top";
              ctx.fillText(
                item.description,
                vertices[0].x + 2,
                vertices[0].y + 2
              );
            }
          });
        };
        image.src = ocrData.images[0];
      }
    }
  }, [translatedData, ocrData]);

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
    } catch (error) {
      toast.error("Error translating file");
      console.error("Error translating file:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-full flex flex-col overflow-auto">
        <DialogHeader className="w-full mt-4">
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
          <div className="w-[50%] h-[100%] flex-1 p-4 justify-center items-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full border border-gray-300"
            />
          </div>
          <ScrollArea className="flex-1 p-4 h-full">
            <h2 className="text-xl font-semibold mb-4">OCR Text</h2>
            {translatedData.length > 0 ? (
              translatedData.map((item, index) => (
                <p key={index}>{item.description}</p>
              ))
            ) : (
              <p>{ocrData.ocrResults[0].description}</p>
            )}
          </ScrollArea>
        </div>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OCRProcess;

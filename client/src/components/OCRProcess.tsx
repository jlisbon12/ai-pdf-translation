import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";

interface OCRProcessProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: {
    images: string[];
    ocrResults: {
      description: string;
      boundingPoly: any;
    }[];
    originalLanguage: string;
  };
}

const OCRProcess: React.FC<OCRProcessProps> = ({
  isOpen,
  onClose,
  ocrData,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>OCR Results</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <ScrollArea className="h-full p-4">
          {ocrData.images.map((image, index) => (
            <div key={index} className="mb-4">
              <Image
                src={image}
                alt={`Page ${index + 1}`}
                width="100"
                height="100"
              />
            </div>
          ))}
          <div>
            <h3 className="text-lg font-medium text-gray-900">OCR Text</h3>
            <p className="mt-2 text-sm text-gray-500">
              {ocrData.ocrResults.map((result, index) => (
                <span key={index}>
                  {result.description}
                  <br />
                </span>
              ))}
            </p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default OCRProcess;

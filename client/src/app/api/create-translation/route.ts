import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { file_key, file_name, ocrData, targetLanguage } = await req.json();

  try {
    const response = await axios.post(
      "http://localhost:4002/translate",
      {
        ocrData: ocrData.ocrResults,
        originalLanguage: ocrData.originalLanguage,
        file_key,
        file_name,
      },
      {
        params: {
          targetLanguage,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.error();
  }
}

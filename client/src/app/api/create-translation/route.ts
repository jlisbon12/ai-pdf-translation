import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { file_key, file_name } = await req.json();

  try {
    const response = await axios.post(
      "http://localhost:4001/process",
      {
        file_key,
        file_name,
      },
      {
        params: {
          targetLanguage: "es", // Default target language, can be modified
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.error();
  }
}

import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: Request,
  { params }: { params: { pdfId: string } }
) {
  const { pdfId } = params;

  try {
    const response = await axios.get(`http://localhost:4000/pdfs/${pdfId}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return NextResponse.error();
  }
}

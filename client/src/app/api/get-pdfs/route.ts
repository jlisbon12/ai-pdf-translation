import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get("http://localhost:4000/pdfs");
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json({ error: "Error fetching PDFs" }, { status: 500 });
  }
}

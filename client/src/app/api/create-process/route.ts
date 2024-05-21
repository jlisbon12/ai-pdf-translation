import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { file_key, file_name } = await req.json();
  try {
    const response = await axios.post("http://localhost:4000/process", {
      file_key,
      file_name,
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating process:", error);
    return NextResponse.json(
      { error: "Error creating process" },
      { status: 500 }
    );
  }
}

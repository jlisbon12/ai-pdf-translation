import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const formData = await req.formData();
  const userId = formData.get("userId") as string;
  const file = formData.get("file") as File;

  // Create a new FormData object to send to the server
  const uploadData = new FormData();
  uploadData.append("userId", userId);
  uploadData.append("file", file);

  try {
    const response = await axios.post(
      "http://localhost:4000/upload",
      uploadData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return NextResponse.error();
  }
}

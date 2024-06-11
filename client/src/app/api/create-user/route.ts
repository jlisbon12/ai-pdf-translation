import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const { userId, email } = await req.json();

  try {
    const response = await axios.post("http://localhost:4000/create-user", {
      userId,
      email,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.error();
  }
}

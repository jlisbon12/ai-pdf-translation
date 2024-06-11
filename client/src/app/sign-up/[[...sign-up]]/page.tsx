"use client";

import { SignUp } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function Page() {
  const router = useRouter();
  const { isLoaded, userId, sessionId, getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }

    const createUser = async () => {
      try {
        const token = await getToken({ template: "integration" });
        await axios.post(
          "/api/create-user",
          { userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        router.push("/");
      } catch (error) {
        console.error("Error creating user:", error);
      }
    };

    createUser();
  }, [isLoaded, userId, getToken, router]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <SignUp />
    </div>
  );
}

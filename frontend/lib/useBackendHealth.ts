"use client";

import { useEffect, useState } from "react";

export type HealthStatus = "loading" | "ok" | "error";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useBackendHealth(): { status: HealthStatus; message: string } {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [message, setMessage] = useState("Checking backend connection...");

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${apiBase}/api/health`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = await response.json();
        if (json.status === "ok") {
          setStatus("ok");
          setMessage("Backend connected");
        } else {
          throw new Error("Unexpected response");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to connect to backend");
      }
    }

    checkHealth();
  }, []);

  return { status, message };
}

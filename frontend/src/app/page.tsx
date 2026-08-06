"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/boards");
    } else if (status === "anonymous") {
      router.replace("/sign-in");
    }
  }, [status, router]);

  return (
    <main className={styles.page}>
      <div className={styles.boardStatus} role="status" aria-live="polite">
        Loading…
      </div>
    </main>
  );
}

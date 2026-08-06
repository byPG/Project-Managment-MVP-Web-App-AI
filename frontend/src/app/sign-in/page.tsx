"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/components/AuthProvider";
import { signIn } from "../../lib/api";
import { useBackendHealth } from "@/lib/useBackendHealth";
import styles from "../page.module.css";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function SignInPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { status: healthStatus, message: healthMessage } = useBackendHealth();

  async function handleSignIn(email: string, password: string) {
    await signIn(apiBase, email, password);
    await refresh();
    router.replace("/boards");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <p className={styles.eyebrow}>Project workspace</p>
            <h1 className={styles.title}>Sign in to your workspace</h1>
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${styles[healthStatus]}`}>
              {healthStatus === "loading"
                ? "Checking backend..."
                : healthStatus === "ok"
                ? "Backend online"
                : "Backend offline"}
            </span>
            <p className={styles.statusMessage}>{healthMessage}</p>
          </div>
        </div>
        <p className={styles.subtitle}>
          New here? <Link href="/sign-up">Create an account</Link>.
        </p>
      </header>

      <AuthForm mode="sign-in" onSubmit={handleSignIn} />
    </main>
  );
}

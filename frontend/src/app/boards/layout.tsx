"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import styles from "./layout.module.css";

export default function BoardsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, status, signOut } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/sign-in");
    }
  }, [status, router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/sign-in");
  }

  if (status !== "authenticated") {
    return (
      <main className={styles.page}>
        <div className={styles.loading} role="status" aria-live="polite">
          Loading…
        </div>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/boards" className={styles.brand}>
          Kanban Board
        </Link>
        <div className={styles.userRow}>
          <span className={styles.userEmail}>{user?.email}</span>
          <button
            type="button"
            className={styles.signOutButton}
            onClick={handleSignOut}
            data-testid="sign-out-button"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}

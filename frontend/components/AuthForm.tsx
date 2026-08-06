"use client";

import { useState, type FormEvent } from "react";
import styles from "./AuthForm.module.css";

type AuthFormMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthFormMode;
  onSubmit: (email: string, password: string) => Promise<void>;
};

const COPY: Record<
  AuthFormMode,
  { heading: string; hint: string; submitLabel: string; submittingLabel: string }
> = {
  "sign-in": {
    heading: "Sign in",
    hint: "Sign in with your email and password.",
    submitLabel: "Sign in",
    submittingLabel: "Signing in…",
  },
  "sign-up": {
    heading: "Create an account",
    hint: "Sign up to create your own workspace.",
    submitLabel: "Sign up",
    submittingLabel: "Creating account…",
  },
};

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = COPY[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(email.trim(), password);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>{copy.heading}</h2>
      <p className={styles.hint}>{copy.hint}</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.inputLabel} htmlFor="email">
          Email
          <input
            id="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={styles.inputField}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className={styles.inputLabel} htmlFor="password">
          Password
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={styles.inputField}
            type="password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
          />
        </label>

        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? copy.submittingLabel : copy.submitLabel}
        </button>
      </form>
    </section>
  );
}

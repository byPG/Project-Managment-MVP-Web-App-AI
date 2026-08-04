"use client";

import { useEffect, useReducer, useState } from "react";
import type { BoardAction, BoardState } from "../../lib/types";
import { Board } from "@/components/Board";
import { boardReducer } from "@/lib/boardReducer";
import {
  addCard,
  deleteCard as deleteCardApi,
  loadBoard,
  moveCard as moveCardApi,
  normalizeBoardResponse,
  renameColumn,
} from "../lib/api";
import styles from "./page.module.css";

type HealthStatus = "loading" | "ok" | "error";

type SignInStatus = "idle" | "submitting";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@kanban.app";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "password123";

const emptyBoardState: BoardState = { cards: {}, columns: [] };

export default function Home() {
  const [state, dispatch] = useReducer(boardReducer, emptyBoardState);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("loading");
  const [healthMessage, setHealthMessage] = useState("Checking backend connection...");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [signInStatus, setSignInStatus] = useState<SignInStatus>("idle");
  const [signInError, setSignInError] = useState("");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [boardError, setBoardError] = useState("");
  // True while the initial board fetch or any mutation's round-trip is in
  // flight. Only used to gate the full-page placeholder before the board has
  // ever loaded (see hasBoard below) — once loaded, the board stays mounted
  // through subsequent mutations instead of flashing out to a placeholder.
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const hasBoard = state.columns.length > 0;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch(`${apiBase}/api/health`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = await response.json();
        if (json.status === "ok") {
          setHealthStatus("ok");
          setHealthMessage("Backend connected");
        } else {
          throw new Error("Unexpected response");
        }
      } catch {
        setHealthStatus("error");
        setHealthMessage("Unable to connect to backend");
      }
    }

    checkHealth();
  }, [apiBase]);

  useEffect(() => {
    async function loadBoardData() {
      setBoardError("");
      setIsBoardLoading(true);

      try {
        const board = await loadBoard(apiBase);
        dispatch({ type: "setBoard", board: normalizeBoardResponse(board) });
      } catch (error) {
        setBoardError(error instanceof Error ? error.message : "Failed to load board.");
      } finally {
        setIsBoardLoading(false);
      }
    }

    if (isSignedIn) {
      loadBoardData();
    }
  }, [apiBase, isSignedIn]);

  async function refreshBoard() {
    const board = await loadBoard(apiBase);
    dispatch({ type: "setBoard", board: normalizeBoardResponse(board) });
  }

  async function handleBoardAction(action: BoardAction) {
    setBoardError("");
    setIsBoardLoading(true);

    try {
      switch (action.type) {
        case "setBoard":
          dispatch(action);
          return;

        case "renameColumn":
          await renameColumn(apiBase, action.columnId, action.title);
          await refreshBoard();
          return;

        case "addCard":
          await addCard(apiBase, action.columnId, action.card.title, action.card.details);
          await refreshBoard();
          return;

        case "deleteCard":
          await deleteCardApi(apiBase, action.cardId);
          await refreshBoard();
          return;

        case "moveCard":
          // Board.tsx only dispatches this for cross-column drops (same-
          // column reordering isn't persisted, so it's a no-op there).
          await moveCardApi(apiBase, action.payload.cardId, action.payload.toColumnId);
          await refreshBoard();
          return;

        default:
          return;
      }
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Unable to update board.");
    } finally {
      setIsBoardLoading(false);
    }
  }

  function dispatchAction(action: BoardAction) {
    void handleBoardAction(action);
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignInError("");

    if (!email.trim() || !password.trim()) {
      setSignInError("Enter both email and password.");
      return;
    }

    setSignInStatus("submitting");

    try {
      const response = await fetch(`${apiBase}/api/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? "Unable to sign in.");
      }

      setIsSignedIn(true);
      setSignInStatus("idle");
    } catch (error) {
      setSignInStatus("idle");
      setSignInError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  if (!isSignedIn) {
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
          <p className={styles.subtitle}>Use demo credentials to enter the board.</p>
        </header>

        <section className={styles.signInCard}>
          <h2 className={styles.signInHeading}>Fake sign-in experience</h2>
          <p className={styles.signInHint}>
            Demo credentials: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_PASSWORD}</strong>
          </p>
          <form className={styles.signInForm} onSubmit={handleSignIn}>
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
                autoComplete="current-password"
                required
              />
            </label>

            {signInError ? <p className={styles.errorMessage}>{signInError}</p> : null}

            <button
              type="submit"
              className={styles.signInButton}
              disabled={signInStatus === "submitting"}
            >
              {signInStatus === "submitting" ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <p className={styles.eyebrow}>Project workspace</p>
            <h1 className={styles.title}>Kanban Board</h1>
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
        <p className={styles.subtitle}>Drag cards between columns to track progress</p>
      </header>

      {boardError ? (
        <p className={styles.statusMessage} role="alert">
          {boardError}
        </p>
      ) : null}
      {hasBoard ? (
        <Board state={state} dispatch={dispatchAction} />
      ) : isBoardLoading ? (
        <div className={styles.boardStatus} role="status" aria-live="polite">
          Loading board data…
        </div>
      ) : null}
    </main>
  );
}

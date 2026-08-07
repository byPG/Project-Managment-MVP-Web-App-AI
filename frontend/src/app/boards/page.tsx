"use client";

import { useEffect, useState } from "react";
import { BoardList } from "@/components/BoardList";
import { createBoard, deleteBoard, listBoards, type ApiBoardSummary } from "@/src/lib/api";
import type { BoardSummary } from "@/lib/types";
import styles from "./page.module.css";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function toBoardSummary(board: ApiBoardSummary): BoardSummary {
  return { id: String(board.id), name: board.name };
}

export default function BoardsPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBoards() {
      try {
        const apiBoards = await listBoards(apiBase);
        setBoards(apiBoards.map(toBoardSummary));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load boards.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBoards();
  }, []);

  async function refreshBoards() {
    const apiBoards = await listBoards(apiBase);
    setBoards(apiBoards.map(toBoardSummary));
  }

  async function handleCreate(name: string) {
    setError("");
    try {
      await createBoard(apiBase, name);
      await refreshBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create board.");
    }
  }

  async function handleDelete(boardId: string) {
    setError("");
    try {
      await deleteBoard(apiBase, boardId);
      await refreshBoards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete board.");
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>Your boards</h1>

      {error ? (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className={styles.loading}>Loading boards…</p>
      ) : (
        <BoardList boards={boards} onCreate={handleCreate} onDelete={handleDelete} />
      )}
    </div>
  );
}

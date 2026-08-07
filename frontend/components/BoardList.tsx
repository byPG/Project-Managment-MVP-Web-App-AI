"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { BoardSummary } from "@/lib/types";
import styles from "./BoardList.module.css";

type BoardListProps = {
  boards: BoardSummary[];
  onCreate: (name: string) => void;
  onDelete: (boardId: string) => void;
};

export function BoardList({ boards, onCreate, onDelete }: BoardListProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Board name is required.");
      return;
    }

    setError("");
    onCreate(trimmed);
    setName("");
  }

  return (
    <div className={styles.wrapper} data-testid="board-list">
      <form className={styles.createForm} data-testid="create-board-form" onSubmit={handleSubmit}>
        <label className={styles.inputLabel} htmlFor="board-name">
          New board name
        </label>
        <div className={styles.createRow}>
          <input
            id="board-name"
            data-testid="board-name-input"
            className={styles.inputField}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Personal errands"
          />
          <button type="submit" className={styles.createButton} data-testid="create-board-button">
            Create board
          </button>
        </div>
        {error ? <p className={styles.errorMessage}>{error}</p> : null}
      </form>

      {boards.length === 0 ? (
        <p className={styles.emptyState}>No boards yet - create your first one above.</p>
      ) : (
        <ul className={styles.boardGrid}>
          {boards.map((board) => (
            <li key={board.id} className={styles.boardCard} data-testid={`board-card-${board.id}`}>
              <Link href={`/boards/${board.id}`} className={styles.boardLink}>
                {board.name}
              </Link>
              <button
                type="button"
                className={styles.deleteButton}
                data-testid={`delete-board-${board.id}`}
                onClick={() => onDelete(board.id)}
                aria-label={`Delete board ${board.name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

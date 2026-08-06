"use client";

import { useRef, useState } from "react";
import styles from "./AddCardModal.module.css";
import type { BoardAction } from "@/lib/types";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type AddCardModalProps = {
  columnId: string;
  columnTitle: string;
  isOpen: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<BoardAction>;
};

export function AddCardModal({
  columnId,
  columnTitle,
  isOpen,
  onClose,
  dispatch,
}: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `add-card-modal-title-${columnId}`;

  if (!isOpen) return null;

  function handleDialogKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      handleClose();
      return;
    }

    if (e.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Card title is required");
      return;
    }

    dispatch({
      type: "addCard",
      columnId,
      card: {
        title: trimmedTitle,
        details: details.trim(),
      },
    });

    setTitle("");
    setDetails("");
    setError("");
    onClose();
  }

  function handleClose() {
    setTitle("");
    setDetails("");
    setError("");
    onClose();
  }

  return (
    <div className={styles.overlay} data-testid="add-card-modal" onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Add Card to <span className={styles.titleAccent}>{columnTitle}</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className={styles.closeButton}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="card-title" className={styles.label}>
              Card Title
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter card title..."
              data-testid="card-title-input"
              autoFocus
              className={styles.input}
            />
            {error && (
              <p className={styles.error}>{error}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="card-details" className={styles.label}>
              Details
            </label>
            <textarea
              id="card-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter card details..."
              data-testid="card-details-input"
              className={styles.textarea}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              data-testid="cancel-card-button"
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-card-button"
              className={styles.submitButton}
            >
              Add Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

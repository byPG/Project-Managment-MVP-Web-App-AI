"use client";

import { useRef, useState } from "react";
import styles from "./CardModal.module.css";
import type { BoardAction } from "@/lib/types";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type CardModalProps =
  | {
      mode: "add";
      columnId: string;
      columnTitle: string;
      isOpen: boolean;
      onClose: () => void;
      dispatch: React.Dispatch<BoardAction>;
    }
  | {
      mode: "edit";
      cardId: string;
      initialTitle: string;
      initialDetails: string;
      isOpen: boolean;
      onClose: () => void;
      dispatch: React.Dispatch<BoardAction>;
    };

export function CardModal(props: CardModalProps) {
  const { mode, isOpen, onClose, dispatch } = props;
  const startingTitle = mode === "edit" ? props.initialTitle : "";
  const startingDetails = mode === "edit" ? props.initialDetails : "";

  const [title, setTitle] = useState(startingTitle);
  const [details, setDetails] = useState(startingDetails);
  const [error, setError] = useState("");
  // Re-sync the form fields to the latest props whenever the modal
  // transitions from closed to open, without an effect: adjusting state
  // during render (rather than after commit) avoids an extra render pass.
  // See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle(startingTitle);
      setDetails(startingDetails);
      setError("");
    }
  }
  const dialogRef = useRef<HTMLDivElement>(null);
  const testId = mode === "add" ? "add-card-modal" : "edit-card-modal";
  const titleId = `${testId}-title`;

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

    if (mode === "add") {
      dispatch({
        type: "addCard",
        columnId: props.columnId,
        card: { title: trimmedTitle, details: details.trim() },
      });
    } else {
      dispatch({
        type: "editCard",
        payload: { cardId: props.cardId, title: trimmedTitle, details: details.trim() },
      });
    }

    handleClose();
  }

  function handleClose() {
    setTitle(startingTitle);
    setDetails(startingDetails);
    setError("");
    onClose();
  }

  return (
    <div className={styles.overlay} data-testid={testId} onClick={handleClose}>
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
            {mode === "add" ? (
              <>
                Add Card to <span className={styles.titleAccent}>{props.columnTitle}</span>
              </>
            ) : (
              "Edit Card"
            )}
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
              {mode === "add" ? "Add Card" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

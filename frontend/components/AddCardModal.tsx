"use client";

import { useState } from "react";
import type { BoardAction } from "@/lib/types";

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

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/80 backdrop-blur-sm p-4"
      data-testid="add-card-modal"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Add Card to <span className="text-primary-blue">{columnTitle}</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-text-secondary hover:bg-bg-main hover:text-text-primary transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="card-title"
              className="block text-xs font-semibold uppercase tracking-wider text-secondary-purple"
            >
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
              className="mt-1.5 w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
            {error && (
              <p className="mt-1 text-xs text-danger-coral font-medium">{error}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="card-details"
              className="block text-xs font-semibold uppercase tracking-wider text-secondary-purple"
            >
              Details
            </label>
            <textarea
              id="card-details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter card details..."
              data-testid="card-details-input"
              className="mt-1.5 w-full rounded-lg border border-border bg-bg-main px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary-blue focus:outline-none focus:ring-1 focus:ring-primary-blue resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              data-testid="cancel-card-button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-main hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-card-button"
              className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-text-primary hover:bg-primary-blue/80 focus:outline-none focus:ring-2 focus:ring-accent-teal transition-all shadow-md shadow-primary-blue/20"
            >
              Add Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

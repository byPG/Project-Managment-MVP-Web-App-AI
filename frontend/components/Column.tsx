"use client";

import { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "@/components/Card";
import { CardModal } from "@/components/CardModal";
import styles from "./Column.module.css";
import type { BoardAction, Column as ColumnType, Card as CardType } from "@/lib/types";

type ColumnProps = {
  column: ColumnType;
  cards: CardType[];
  dispatch: React.Dispatch<BoardAction>;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
};

export function Column({
  column,
  cards,
  dispatch,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
}: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  function handleTitleSubmit() {
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== column.title) {
      dispatch({
        type: "renameColumn",
        columnId: column.id,
        title: trimmed,
      });
    } else {
      setTitleInput(column.title);
    }
    setIsEditingTitle(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setTitleInput(column.title);
      setIsEditingTitle(false);
    }
  }

  function handleDeleteColumn() {
    dispatch({ type: "deleteColumn", columnId: column.id });
  }

  return (
    <>
      <div
        ref={setNodeRef}
        data-testid={`column-${column.id}`}
        className={`${styles.column} ${isOver ? styles.columnActive : ""}`}
      >
        {/* Column Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                data-testid={`column-title-input-${column.id}`}
                aria-label={`Rename ${column.title} column`}
                autoFocus
                className={styles.titleInput}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(column.title);
                  setIsEditingTitle(true);
                }}
                data-testid={`column-title-${column.id}`}
                className={styles.titleButton}
              >
                <span className={styles.titleText}>{column.title}</span>
                <svg
                  className={styles.titleIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={onMoveLeft}
              disabled={!canMoveLeft}
              aria-label={`Move ${column.title} column left`}
              data-testid={`move-column-left-${column.id}`}
              className={styles.moveButton}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={onMoveRight}
              disabled={!canMoveRight}
              aria-label={`Move ${column.title} column right`}
              data-testid={`move-column-right-${column.id}`}
              className={styles.moveButton}
            >
              ›
            </button>
            <span data-testid={`column-count-${column.id}`} className={styles.countBadge}>
              {cards.length}
            </span>
            <button
              type="button"
              onClick={handleDeleteColumn}
              aria-label={`Delete ${column.title} column`}
              data-testid={`delete-column-${column.id}`}
              className={styles.deleteColumnButton}
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Droppable Card List */}
        <div data-testid={`column-droppable-${column.id}`} className={styles.cardList}>
          <SortableContext
            items={column.cardIds}
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <Card key={card.id} card={card} dispatch={dispatch} />
            ))}
          </SortableContext>
          {cards.length === 0 && (
            <div className={styles.emptyState}>
              Drop tasks here
            </div>
          )}
        </div>

        {/* Add Card Action */}
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          data-testid={`add-card-button-${column.id}`}
          className={styles.addButton}
        >
          <svg
            className={styles.addIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      </div>

      <CardModal
        mode="add"
        columnId={column.id}
        columnTitle={column.title}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          addButtonRef.current?.focus();
        }}
        dispatch={dispatch}
      />
    </>
  );
}

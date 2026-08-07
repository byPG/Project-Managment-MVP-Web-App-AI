"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardModal } from "@/components/CardModal";
import styles from "./Card.module.css";
import type { BoardAction, Card as CardType } from "@/lib/types";

type CardProps = {
  card: CardType;
  dispatch?: React.Dispatch<BoardAction>;
  overlay?: boolean;
};

export function Card({ card, dispatch, overlay = false }: CardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: overlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (dispatch) {
      dispatch({ type: "deleteCard", cardId: card.id });
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setIsEditOpen(true);
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        data-testid={`card-${card.id}`}
        className={`${styles.card} ${isDragging ? styles.cardDragging : ""} ${overlay ? styles.cardOverlay : styles.cardGrab}`}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>
            {card.title}
          </h3>
          {dispatch && !overlay && (
            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleEdit}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Edit card"
                data-testid={`edit-card-${card.id}`}
                className={styles.editButton}
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Delete card"
                data-testid={`delete-card-${card.id}`}
                className={styles.deleteButton}
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
          )}
        </div>
        {card.details && (
          <p className={styles.details}>
            {card.details}
          </p>
        )}
      </div>

      {dispatch && !overlay && (
        <CardModal
          mode="edit"
          cardId={card.id}
          initialTitle={card.title}
          initialDetails={card.details}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          dispatch={dispatch}
        />
      )}
    </>
  );
}

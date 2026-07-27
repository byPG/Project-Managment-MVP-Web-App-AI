"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardAction, Card as CardType } from "@/lib/types";

type CardProps = {
  card: CardType;
  dispatch?: React.Dispatch<BoardAction>;
  overlay?: boolean;
};

export function Card({ card, dispatch, overlay = false }: CardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
      className={`group relative rounded-lg border bg-surface-elevated p-4 transition-all duration-200 ${
        isDragging
          ? "opacity-30 border-accent-teal/50"
          : "border-border hover:border-accent-teal/60 hover:shadow-lg hover:shadow-accent-teal/5"
      } ${
        overlay
          ? "shadow-2xl shadow-accent-teal/20 border-accent-teal cursor-grabbing"
          : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-text-primary text-base leading-snug group-hover:text-accent-teal transition-colors">
          {card.title}
        </h3>
        {dispatch && !overlay && (
          <button
            type="button"
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Delete card"
            data-testid={`delete-card-${card.id}`}
            className="opacity-0 group-hover:opacity-100 rounded p-1 text-text-secondary hover:bg-danger-coral/20 hover:text-danger-coral transition-all focus:opacity-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
      {card.details && (
        <p className="mt-2 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {card.details}
        </p>
      )}
    </div>
  );
}

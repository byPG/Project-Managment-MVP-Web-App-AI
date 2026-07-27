"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "@/components/Card";
import { AddCardModal } from "@/components/AddCardModal";
import type { BoardAction, Column as ColumnType, Card as CardType } from "@/lib/types";

type ColumnProps = {
  column: ColumnType;
  cards: CardType[];
  dispatch: React.Dispatch<BoardAction>;
};

export function Column({ column, cards, dispatch }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(column.title);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  return (
    <>
      <div
        ref={setNodeRef}
        data-testid={`column-${column.id}`}
        className={`flex w-80 shrink-0 flex-col rounded-xl border bg-surface p-4 transition-colors duration-200 ${
          isOver ? "border-accent-teal shadow-lg shadow-accent-teal/10 bg-surface/90" : "border-border"
        }`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                data-testid={`column-title-input-${column.id}`}
                autoFocus
                className="w-full rounded border border-primary-blue bg-bg-main px-2 py-1 text-sm font-semibold text-text-primary focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(column.title);
                  setIsEditingTitle(true);
                }}
                data-testid={`column-title-${column.id}`}
                className="group/title flex items-center gap-1.5 text-left text-sm font-bold text-text-primary hover:text-accent-teal transition-colors truncate"
              >
                <span className="truncate">{column.title}</span>
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-text-secondary opacity-0 group-hover/title:opacity-100 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

          <span
            data-testid={`column-count-${column.id}`}
            className="rounded-full bg-bg-main px-2.5 py-0.5 text-xs font-semibold text-secondary-purple border border-border"
          >
            {cards.length}
          </span>
        </div>

        {/* Droppable Card List */}
        <div
          data-testid={`column-droppable-${column.id}`}
          className="mt-3 flex-1 min-h-[150px] space-y-3 rounded-lg bg-bg-main/50 p-2 overflow-y-auto"
        >
          <SortableContext
            items={column.cardIds}
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <Card key={card.id} card={card} dispatch={dispatch} />
            ))}
          </SortableContext>
          {cards.length === 0 && (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-xs text-text-secondary/60 pointer-events-none select-none">
              Drop tasks here
            </div>
          )}
        </div>

        {/* Add Card Action */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          data-testid={`add-card-button-${column.id}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-secondary-purple/40 py-2 text-xs font-semibold text-secondary-purple hover:border-primary-blue hover:bg-primary-blue/5 hover:text-primary-blue transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      </div>

      <AddCardModal
        columnId={column.id}
        columnTitle={column.title}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        dispatch={dispatch}
      />
    </>
  );
}

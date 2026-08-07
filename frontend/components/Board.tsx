"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "@/components/Column";
import { Card } from "@/components/Card";
import { resolveColumnMove, resolveDragMove } from "@/lib/boardReducer";
import styles from "./Board.module.css";
import type { BoardAction, BoardState, Card as CardType } from "@/lib/types";

type BoardProps = {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
};

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function Board({ state, dispatch }: BoardProps) {
  const isMounted = useIsMounted();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const customCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  };

  function handleDragStart(event: DragStartEvent) {
    const card = state.cards[String(event.active.id)];
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // Reordering within a column isn't persisted by the backend, so a drop
    // that resolves to the card's current column (including a card dropped
    // on itself) is correctly treated as a no-op inside resolveDragMove,
    // rather than an illusory local reorder that would silently revert on
    // the next board refresh.
    const payload = resolveDragMove(state.columns, activeId, overId);
    if (!payload) {
      return;
    }

    dispatch({ type: "moveCard", payload });
  }

  function handleAddColumnSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newColumnTitle.trim();
    if (!trimmed) {
      return;
    }

    dispatch({ type: "addColumn", title: trimmed });
    setNewColumnTitle("");
    setIsAddingColumn(false);
  }

  const boardContent = (
    <div className={styles.boardShell}>
      <div className={styles.boardInner} data-testid="kanban-board">
        {state.columns.map((column, index) => (
          <Column
            key={column.id}
            column={column}
            cards={column.cardIds
              .map((cardId) => state.cards[cardId])
              .filter(Boolean)}
            dispatch={dispatch}
            canMoveLeft={index > 0}
            canMoveRight={index < state.columns.length - 1}
            onMoveLeft={() =>
              dispatch({
                type: "reorderColumns",
                columnIds: resolveColumnMove(state.columns, column.id, "left"),
              })
            }
            onMoveRight={() =>
              dispatch({
                type: "reorderColumns",
                columnIds: resolveColumnMove(state.columns, column.id, "right"),
              })
            }
          />
        ))}

        <div className={styles.addColumnWrapper}>
          {isAddingColumn ? (
            <form onSubmit={handleAddColumnSubmit} className={styles.addColumnForm}>
              <input
                autoFocus
                value={newColumnTitle}
                onChange={(event) => setNewColumnTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setNewColumnTitle("");
                    setIsAddingColumn(false);
                  }
                }}
                placeholder="Column name"
                aria-label="New column name"
                data-testid="add-column-input"
                className={styles.addColumnInput}
              />
              <button type="submit" data-testid="add-column-submit" className={styles.addColumnSubmit}>
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingColumn(true)}
              data-testid="add-column-button"
              className={styles.addColumnButton}
            >
              + Add column
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isMounted) {
    return boardContent;
  }

  return (
    <DndContext
      id="kanban-board-dnd-context"
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {boardContent}

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div style={{ transform: "rotate(2deg)", opacity: 0.95 }}>
            <Card card={activeCard} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

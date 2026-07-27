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

    if (activeId === overId) {
      return;
    }

    const fromColumn = state.columns.find((column) =>
      column.cardIds.includes(activeId),
    );
    if (!fromColumn) {
      return;
    }

    let toColumn = state.columns.find((column) => column.id === overId);
    let toIndex: number;

    if (toColumn) {
      toIndex = toColumn.cardIds.length;
    } else {
      toColumn = state.columns.find((column) => column.cardIds.includes(overId));
      if (!toColumn) {
        return;
      }
      toIndex = toColumn.cardIds.indexOf(overId);
    }

    const fromIndex = fromColumn.cardIds.indexOf(activeId);
    if (fromColumn.id === toColumn.id && fromIndex < toIndex) {
      toIndex -= 1;
    }

    dispatch({
      type: "moveCard",
      payload: {
        cardId: activeId,
        fromColumnId: fromColumn.id,
        toColumnId: toColumn.id,
        toIndex,
      },
    });
  }

  const boardContent = (
    <div className="flex-1 overflow-x-auto px-6 py-6">
      <div
        className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1800px] gap-4"
        data-testid="kanban-board"
      >
        {state.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={column.cardIds
              .map((cardId) => state.cards[cardId])
              .filter(Boolean)}
            dispatch={dispatch}
          />
        ))}
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
          <div className="rotate-2 opacity-95">
            <Card card={activeCard} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

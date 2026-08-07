"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BoardAction, BoardState } from "@/lib/types";
import { Board } from "@/components/Board";
import { boardReducer } from "@/lib/boardReducer";
import {
  ApiError,
  addCard,
  createColumn,
  deleteCard as deleteCardApi,
  deleteColumn,
  loadBoard,
  moveCard as moveCardApi,
  normalizeBoardResponse,
  renameColumn,
  reorderColumns,
  updateCard,
} from "@/src/lib/api";
import styles from "./page.module.css";

const emptyBoardState: BoardState = { cards: {}, columns: [] };
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const [state, dispatch] = useReducer(boardReducer, emptyBoardState);
  const [boardName, setBoardName] = useState("");
  const [boardError, setBoardError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isBoardLoading, setIsBoardLoading] = useState(true);
  const hasBoard = state.columns.length > 0;

  useEffect(() => {
    async function loadBoardData() {
      setBoardError("");
      setNotFound(false);
      setIsBoardLoading(true);

      try {
        const board = await loadBoard(apiBase, boardId);
        setBoardName(board.name);
        dispatch({ type: "setBoard", board: normalizeBoardResponse(board) });
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setBoardError(error instanceof Error ? error.message : "Failed to load board.");
        }
      } finally {
        setIsBoardLoading(false);
      }
    }

    loadBoardData();
  }, [boardId]);

  async function refreshBoard() {
    const board = await loadBoard(apiBase, boardId);
    setBoardName(board.name);
    dispatch({ type: "setBoard", board: normalizeBoardResponse(board) });
  }

  async function handleBoardAction(action: BoardAction) {
    setBoardError("");

    try {
      switch (action.type) {
        case "setBoard":
          dispatch(action);
          return;

        case "renameColumn":
          await renameColumn(apiBase, action.columnId, action.title);
          await refreshBoard();
          return;

        case "addCard":
          await addCard(apiBase, action.columnId, action.card.title, action.card.details);
          await refreshBoard();
          return;

        case "editCard":
          await updateCard(apiBase, action.payload.cardId, action.payload.title, action.payload.details);
          await refreshBoard();
          return;

        case "deleteCard":
          await deleteCardApi(apiBase, action.cardId);
          await refreshBoard();
          return;

        case "moveCard":
          // Board.tsx only dispatches this for cross-column drops (same-
          // column reordering isn't persisted, so it's a no-op there).
          await moveCardApi(apiBase, action.payload.cardId, action.payload.toColumnId);
          await refreshBoard();
          return;

        case "addColumn":
          await createColumn(apiBase, boardId, action.title);
          await refreshBoard();
          return;

        case "deleteColumn":
          await deleteColumn(apiBase, action.columnId);
          await refreshBoard();
          return;

        case "reorderColumns":
          await reorderColumns(apiBase, boardId, action.columnIds);
          await refreshBoard();
          return;

        default:
          return;
      }
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Unable to update board.");
    }
  }

  function dispatchAction(action: BoardAction) {
    void handleBoardAction(action);
  }

  if (notFound) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.notFound}>Board not found.</p>
        <Link href="/boards" className={styles.backLink}>
          Back to your boards
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.boardHeader}>
        <Link href="/boards" className={styles.backLink}>
          ← Your boards
        </Link>
        {boardName ? <h1 className={styles.heading}>{boardName}</h1> : null}
      </div>

      {boardError ? (
        <p className={styles.errorMessage} role="alert">
          {boardError}
        </p>
      ) : null}

      {hasBoard ? (
        <Board state={state} dispatch={dispatchAction} />
      ) : isBoardLoading ? (
        <div className={styles.loading} role="status" aria-live="polite">
          Loading board data…
        </div>
      ) : null}
    </div>
  );
}

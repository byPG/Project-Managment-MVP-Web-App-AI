"use client";

import { useReducer } from "react";
import { Board } from "@/components/Board";
import { boardReducer } from "@/lib/boardReducer";
import { dummyBoardState } from "@/lib/dummyData";
import styles from "./page.module.css";

export default function Home() {
  const [state, dispatch] = useReducer(boardReducer, dummyBoardState);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <p className={styles.eyebrow}>Project workspace</p>
            <h1 className={styles.title}>Kanban Board</h1>
          </div>
          <p className={styles.subtitle}>Drag cards between columns to track progress</p>
        </div>
      </header>

      <Board state={state} dispatch={dispatch} />
    </main>
  );
}

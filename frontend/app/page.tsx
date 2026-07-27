"use client";

import { useReducer } from "react";
import { Board } from "@/components/Board";
import { boardReducer } from "@/lib/boardReducer";
import { dummyBoardState } from "@/lib/dummyData";

export default function Home() {
  const [state, dispatch] = useReducer(boardReducer, dummyBoardState);

  return (
    <main className="flex min-h-screen flex-col bg-bg-main">
      <header className="border-b border-border bg-surface/80 px-6 py-5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-secondary-purple">
              Project workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-text-primary">
              Kanban Board
            </h1>
          </div>
          <p className="hidden text-sm text-text-secondary sm:block">
            Drag cards between columns to track progress
          </p>
        </div>
      </header>

      <Board state={state} dispatch={dispatch} />
    </main>
  );
}

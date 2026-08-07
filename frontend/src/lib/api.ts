import type { BoardState } from "../../lib/types";

type ApiCard = {
  id: number;
  title: string;
  details: string;
  position: number;
};

type ApiColumn = {
  id: number;
  name: string;
  position: number;
  cards: ApiCard[];
};

type ApiBoard = {
  id: number;
  name: string;
  columns: ApiColumn[];
};

export type ApiBoardSummary = {
  id: number;
  name: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, credentials: "include" });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.detail || body?.message || response.statusText;
    throw new ApiError(detail || "Request failed", response.status);
  }

  return body;
}

export type ApiUser = {
  id: number;
  email: string;
};

export async function signUp(apiBase: string, email: string, password: string): Promise<ApiUser> {
  return fetchJson(`${apiBase}/api/auth/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function signIn(apiBase: string, email: string, password: string): Promise<ApiUser> {
  return fetchJson(`${apiBase}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut(apiBase: string): Promise<void> {
  await fetchJson(`${apiBase}/api/auth/sign-out`, { method: "POST" });
}

export async function fetchCurrentUser(apiBase: string): Promise<ApiUser> {
  return fetchJson(`${apiBase}/api/auth/me`);
}

export function normalizeBoardResponse(board: ApiBoard): BoardState {
  const cards: Record<string, { id: string; title: string; details: string }> = {};

  const columns = board.columns.map((column) => {
    const cardIds = column.cards.map((card) => {
      const id = String(card.id);
      cards[id] = {
        id,
        title: card.title,
        details: card.details,
      };
      return id;
    });

    return {
      id: String(column.id),
      title: column.name,
      cardIds,
    };
  });

  return { cards, columns };
}

export async function listBoards(apiBase: string): Promise<ApiBoardSummary[]> {
  return fetchJson(`${apiBase}/api/boards`);
}

export async function createBoard(apiBase: string, name: string): Promise<ApiBoardSummary> {
  return fetchJson(`${apiBase}/api/boards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function renameBoard(apiBase: string, boardId: string, name: string): Promise<ApiBoardSummary> {
  return fetchJson(`${apiBase}/api/boards/${boardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteBoard(apiBase: string, boardId: string): Promise<void> {
  await fetchJson(`${apiBase}/api/boards/${boardId}`, { method: "DELETE" });
}

export async function loadBoard(apiBase: string, boardId: string): Promise<ApiBoard> {
  return fetchJson(`${apiBase}/api/boards/${boardId}`);
}

export async function renameColumn(apiBase: string, columnId: string, title: string) {
  return fetchJson(`${apiBase}/api/columns/${columnId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function addCard(apiBase: string, columnId: string, title: string, details: string) {
  return fetchJson(`${apiBase}/api/columns/${columnId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, details }),
  });
}

export async function deleteCard(apiBase: string, cardId: string) {
  return fetchJson(`${apiBase}/api/cards/${cardId}`, {
    method: "DELETE",
  });
}

export async function moveCard(apiBase: string, cardId: string, destinationColumnId: string) {
  return fetchJson(`${apiBase}/api/cards/${cardId}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination_column_id: Number(destinationColumnId) }),
  });
}

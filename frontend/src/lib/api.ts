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

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.detail || body?.message || response.statusText;
    throw new Error(detail || "Request failed");
  }

  return body;
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

export async function loadBoard(apiBase: string): Promise<ApiBoard> {
  return fetchJson(`${apiBase}/api/board`);
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

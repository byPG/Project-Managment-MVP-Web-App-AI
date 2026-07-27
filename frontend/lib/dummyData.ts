import type { BoardState } from "./types";

export const dummyBoardState: BoardState = {
  cards: {
    "card-1": {
      id: "card-1",
      title: "Research competitors",
      details: "Review three similar products and note UX patterns.",
    },
    "card-2": {
      id: "card-2",
      title: "Draft user stories",
      details: "Capture MVP requirements for the Kanban board.",
    },
    "card-3": {
      id: "card-3",
      title: "Design wireframes",
      details: "Sketch the five-column layout and card interactions.",
    },
    "card-4": {
      id: "card-4",
      title: "Set up project",
      details: "Initialize Next.js app with Tailwind and theme tokens.",
    },
    "card-5": {
      id: "card-5",
      title: "Build board UI",
      details: "Implement columns, cards, and add/delete flows.",
    },
    "card-6": {
      id: "card-6",
      title: "Add drag and drop",
      details: "Integrate dnd-kit for card reordering and moves.",
    },
    "card-7": {
      id: "card-7",
      title: "Write tests",
      details: "Cover reducer logic and critical user flows.",
    },
    "card-8": {
      id: "card-8",
      title: "Polish styling",
      details: "Apply color scheme, spacing, and hover states.",
    },
  },
  columns: [
    { id: "col-1", title: "Backlog", cardIds: ["card-1", "card-2"] },
    { id: "col-2", title: "To Do", cardIds: ["card-3", "card-4"] },
    { id: "col-3", title: "In Progress", cardIds: ["card-5", "card-6"] },
    { id: "col-4", title: "Review", cardIds: ["card-7"] },
    { id: "col-5", title: "Done", cardIds: ["card-8"] },
  ],
};

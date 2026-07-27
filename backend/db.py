from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional

from sqlmodel import Field, Relationship, Session, SQLModel, create_engine, select

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DATABASE_DIR / 'app.db'}")

class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    columns: List["Column"] = Relationship(back_populates="board")

class Column(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="board.id")
    name: str
    position: int
    board: Optional[Board] = Relationship(back_populates="columns")
    cards: List["Card"] = Relationship(back_populates="column")

class Card(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    column_id: int = Field(foreign_key="column.id")
    title: str
    details: str
    position: int
    column: Optional[Column] = Relationship(back_populates="cards")

COLUMN_NAMES = ["Backlog", "To Do", "In Progress", "Review", "Done"]

INITIAL_CARDS = [
    ("Research competitors", "Review three similar products and note UX patterns.", 1),
    ("Draft user stories", "Capture MVP requirements for the Kanban board.", 1),
    ("Design wireframes", "Sketch the five-column layout and card interactions.", 2),
    ("Set up project", "Initialize Next.js app with Tailwind and theme tokens.", 2),
    ("Build board UI", "Implement columns, cards, and add/delete flows.", 3),
    ("Add drag and drop", "Integrate dnd-kit for card reordering and moves.", 3),
    ("Write tests", "Cover reducer logic and critical user flows.", 4),
    ("Polish styling", "Apply color scheme, spacing, and hover states.", 5),
]


def get_engine(database_url: str = DATABASE_URL):
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    return create_engine(database_url, echo=False)


def seed_initial_data(session: Session) -> None:
    board = Board(name="Project Kanban Board")
    session.add(board)
    session.commit()
    session.refresh(board)

    columns = []
    for position, name in enumerate(COLUMN_NAMES, start=1):
        columns.append(Column(board_id=board.id, name=name, position=position))

    session.add_all(columns)
    session.commit()

    column_by_position = {column.position: column for column in columns}
    cards = []
    for position, (title, details, column_position) in enumerate(INITIAL_CARDS, start=1):
        column = column_by_position[column_position]
        cards.append(
            Card(
                column_id=column.id,
                title=title,
                details=details,
                position=position,
            ),
        )

    session.add_all(cards)
    session.commit()


def create_db_and_tables(engine=None):
    engine = engine or get_engine()
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        existing_board = session.exec(select(Board)).first()
        if existing_board is None:
            seed_initial_data(session)

    return engine

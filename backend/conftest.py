import os
from typing import Iterator

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from db import Board, Column, seed_initial_data
from main import app, get_session


@pytest.fixture()
def engine():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    return test_engine


@pytest.fixture()
def session(engine) -> Iterator[Session]:
    with Session(engine) as db_session:
        yield db_session


@pytest.fixture()
def client(session: Session) -> Iterator[TestClient]:
    def override_get_session() -> Iterator[Session]:
        yield session

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded_board(session: Session):
    seed_initial_data(session)
    board = session.exec(select(Board)).first()
    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    return {"board": board, "columns": columns}

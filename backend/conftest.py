import os
from typing import Iterator

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
# Full-cost bcrypt (~200-300ms/hash) turns every signup-driven fixture into
# minutes of test time; a low round count keeps hashing correct but fast.
os.environ.setdefault("BCRYPT_ROUNDS", "4")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

import auth
from db import Column, User, create_default_board
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
def user(session: Session) -> User:
    new_user = User(email="owner@example.com", hashed_password=auth.hash_password("password123"))
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@pytest.fixture()
def seeded_board(session: Session, user: User):
    board = create_default_board(session, owner_id=user.id)
    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    return {"board": board, "columns": columns, "user": user}

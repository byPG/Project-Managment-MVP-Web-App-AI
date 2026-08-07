import os
from contextlib import asynccontextmanager
from typing import Iterator

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Body
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlmodel import Session, select

import auth
from db import Board, Card, Column, User, create_board, create_default_board, get_engine

DEMO_EMAIL = os.environ.get("DEMO_EMAIL", "demo@kanban.app")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "password123")

engine = get_engine()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def get_current_user(
    access_token: str | None = Cookie(default=None, alias=auth.COOKIE_NAME),
    session: Session = Depends(get_session),
) -> User:
    if access_token is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = auth.decode_access_token(access_token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return user


def get_owned_board(board_id: int, user: User, session: Session) -> Board:
    board = session.get(Board, board_id)
    if board is None or board.owner_id != user.id:
        # 404 rather than 403 so a guessed id can't be distinguished from one
        # that genuinely doesn't exist.
        raise HTTPException(status_code=404, detail="Board not found")
    return board


def get_owned_column(column_id: int, user: User, session: Session) -> Column:
    column = session.get(Column, column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    board = session.get(Board, column.board_id)
    if board is None or board.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Column not found")

    return column


def get_owned_card(card_id: int, user: User, session: Session) -> Card:
    card = session.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    column = session.get(Column, card.column_id)
    board = session.get(Board, column.board_id) if column is not None else None
    if board is None or board.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Card not found")

    return card


def delete_column_cascade(column_id: int, session: Session) -> None:
    cards = session.exec(select(Card).where(Card.column_id == column_id)).all()
    for card in cards:
        session.delete(card)

    column = session.get(Column, column_id)
    if column is not None:
        session.delete(column)

    session.commit()


def delete_board_cascade(board_id: int, session: Session) -> None:
    columns = session.exec(select(Column).where(Column.board_id == board_id)).all()
    for column in columns:
        cards = session.exec(select(Card).where(Card.column_id == column.id)).all()
        for card in cards:
            session.delete(card)
        session.delete(column)

    board = session.get(Board, board_id)
    if board is not None:
        session.delete(board)

    session.commit()


def set_auth_cookie(response: Response, user_id: int) -> None:
    token = auth.create_access_token(user_id)
    response.set_cookie(
        auth.COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        secure=auth.COOKIE_SECURE,
        path="/",
        max_age=auth.ACCESS_TOKEN_TTL_SECONDS,
    )


def ensure_demo_user(session: Session) -> None:
    existing = session.exec(select(User).where(User.email == DEMO_EMAIL)).first()
    if existing is not None:
        return

    user = User(email=DEMO_EMAIL, hashed_password=auth.hash_password(DEMO_PASSWORD))
    session.add(user)
    session.commit()
    session.refresh(user)
    create_default_board(session, owner_id=user.id, name="Project Kanban Board")


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        ensure_demo_user(session)
    yield


app = FastAPI(lifespan=lifespan)

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str

class BoardSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

class BoardCreateRequest(BaseModel):
    name: str = Field(max_length=100)

class BoardRenameRequest(BaseModel):
    name: str = Field(max_length=100)

class ColumnRenameRequest(BaseModel):
    title: str = Field(max_length=100)

class AddColumnRequest(BaseModel):
    title: str = Field(max_length=100)

class ReorderColumnsRequest(BaseModel):
    column_ids: list[int]

class AddCardRequest(BaseModel):
    title: str = Field(max_length=200)
    details: str = Field(default="", max_length=2000)

class UpdateCardRequest(BaseModel):
    title: str = Field(max_length=200)
    details: str = Field(default="", max_length=2000)

class MoveCardRequest(BaseModel):
    destination_column_id: int

class CardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    column_id: int
    title: str
    details: str
    position: int

class ColumnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    position: int
    cards: list[CardRead]

class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    columns: list[ColumnRead]

def reorder_cards(column_id: int, session: Session) -> None:
    cards = session.exec(
        select(Card).where(Card.column_id == column_id).order_by(Card.position),
    ).all()
    for index, card in enumerate(cards, start=1):
        card.position = index
        session.add(card)
    session.commit()


def reorder_columns(board_id: int, session: Session) -> None:
    columns = session.exec(
        select(Column).where(Column.board_id == board_id).order_by(Column.position),
    ).all()
    for index, column in enumerate(columns, start=1):
        column.position = index
        session.add(column)
    session.commit()


def build_column_read(column: Column, session: Session) -> ColumnRead:
    cards = session.exec(
        select(Card).where(Card.column_id == column.id).order_by(Card.position),
    ).all()
    return ColumnRead(
        id=column.id,
        name=column.name,
        position=column.position,
        cards=[CardRead.model_validate(card) for card in cards],
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/board", response_model=BoardRead, deprecated=True)
def get_board(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Deprecated: superseded by GET /api/boards/{board_id}. Kept only so
    # already-built frontend code that hasn't migrated to board-scoped URLs
    # keeps working; returns the caller's first board. Removed in Part 18.
    board = session.exec(
        select(Board).where(Board.owner_id == user.id).order_by(Board.id),
    ).first()
    if board is None:
        raise HTTPException(status_code=500, detail="Board data is not available")

    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()

    result_columns = [build_column_read(column, session) for column in columns]

    return BoardRead(id=board.id, name=board.name, columns=result_columns)


@app.get("/api/boards", response_model=list[BoardSummary])
def list_boards(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(
        select(Board).where(Board.owner_id == user.id).order_by(Board.id),
    ).all()


@app.post("/api/boards", response_model=BoardSummary, status_code=201)
def create_board_route(
    payload: BoardCreateRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Board name must not be empty")

    return create_board(session, owner_id=user.id, name=name)


@app.get("/api/boards/{board_id}", response_model=BoardRead)
def get_board_by_id(
    board_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    board = get_owned_board(board_id, user, session)

    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    result_columns = [build_column_read(column, session) for column in columns]

    return BoardRead(id=board.id, name=board.name, columns=result_columns)


@app.patch("/api/boards/{board_id}", response_model=BoardSummary)
def rename_board(
    board_id: int,
    payload: BoardRenameRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Board name must not be empty")

    board = get_owned_board(board_id, user, session)
    board.name = name
    session.add(board)
    session.commit()
    session.refresh(board)

    return board


@app.delete("/api/boards/{board_id}")
def delete_board(
    board_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    get_owned_board(board_id, user, session)
    delete_board_cascade(board_id, session)

    return {"status": "ok"}


@app.post("/api/boards/{board_id}/columns", response_model=ColumnRead, status_code=201)
def add_column(
    board_id: int,
    payload: AddColumnRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Column title must not be empty")

    board = get_owned_board(board_id, user, session)

    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    next_position = columns[-1].position + 1 if columns else 1

    column = Column(board_id=board.id, name=title, position=next_position)
    session.add(column)
    session.commit()
    session.refresh(column)

    return build_column_read(column, session)


@app.patch("/api/boards/{board_id}/columns/reorder", response_model=list[ColumnRead])
def reorder_columns_route(
    board_id: int,
    payload: ReorderColumnsRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    board = get_owned_board(board_id, user, session)

    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    existing_ids = {column.id for column in columns}
    submitted_ids = payload.column_ids

    if set(submitted_ids) != existing_ids or len(submitted_ids) != len(existing_ids):
        raise HTTPException(
            status_code=400,
            detail="Column order must include every column exactly once",
        )

    columns_by_id = {column.id: column for column in columns}
    for index, column_id in enumerate(submitted_ids, start=1):
        columns_by_id[column_id].position = index
        session.add(columns_by_id[column_id])
    session.commit()

    result_columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()
    return [build_column_read(column, session) for column in result_columns]


@app.delete("/api/columns/{column_id}")
def delete_column(
    column_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    column = get_owned_column(column_id, user, session)
    board_id = column.board_id

    delete_column_cascade(column_id, session)
    reorder_columns(board_id, session)

    return {"status": "ok"}


@app.patch("/api/columns/{column_id}", response_model=ColumnRead)
def rename_column(
    column_id: int,
    payload: ColumnRenameRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Column title must not be empty")

    column = get_owned_column(column_id, user, session)

    column.name = title
    session.add(column)
    session.commit()
    session.refresh(column)

    return build_column_read(column, session)


@app.post("/api/columns/{column_id}/cards", response_model=CardRead)
def add_card(
    column_id: int,
    payload: AddCardRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Card title is required")

    column = get_owned_column(column_id, user, session)

    cards = session.exec(
        select(Card).where(Card.column_id == column.id).order_by(Card.position),
    ).all()
    next_position = cards[-1].position + 1 if cards else 1

    card = Card(
        column_id=column.id,
        title=title,
        details=payload.details.strip(),
        position=next_position,
    )
    session.add(card)
    session.commit()
    session.refresh(card)

    return CardRead.model_validate(card)


@app.patch("/api/cards/{card_id}", response_model=CardRead)
def update_card(
    card_id: int,
    payload: UpdateCardRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Card title is required")

    card = get_owned_card(card_id, user, session)
    card.title = title
    card.details = payload.details.strip()
    session.add(card)
    session.commit()
    session.refresh(card)

    return CardRead.model_validate(card)


@app.delete("/api/cards/{card_id}")
def delete_card(
    card_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    card = get_owned_card(card_id, user, session)

    column_id = card.column_id
    session.delete(card)
    session.commit()
    reorder_cards(column_id, session)

    return {"status": "ok"}


@app.patch("/api/cards/{card_id}/move", response_model=CardRead)
def move_card(
    card_id: int,
    payload: MoveCardRequest = Body(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    card = get_owned_card(card_id, user, session)

    destination_column = session.get(Column, payload.destination_column_id)
    destination_board = (
        session.get(Board, destination_column.board_id) if destination_column is not None else None
    )
    source_column = session.get(Column, card.column_id)
    # A single check covering "doesn't exist", "not owned", and "belongs to
    # a different one of the caller's own boards" - all indistinguishable
    # from the caller's point of view, so they share one 404 message.
    if (
        destination_column is None
        or destination_board is None
        or destination_board.owner_id != user.id
        or source_column is None
        or destination_column.board_id != source_column.board_id
    ):
        raise HTTPException(status_code=404, detail="Destination column not found")

    source_column_id = card.column_id
    card.column_id = destination_column.id

    destination_cards = session.exec(
        select(Card).where(Card.column_id == destination_column.id).order_by(Card.position),
    ).all()
    card.position = destination_cards[-1].position + 1 if destination_cards else 1

    session.add(card)
    session.commit()
    session.refresh(card)
    reorder_cards(source_column_id, session)

    return CardRead.model_validate(card)


@app.post("/api/auth/sign-up", response_model=UserRead, status_code=201)
def sign_up(response: Response, payload: SignUpRequest = Body(...), session: Session = Depends(get_session)):
    email = payload.email.strip().lower()

    existing = session.exec(select(User).where(User.email == email)).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(email=email, hashed_password=auth.hash_password(payload.password))
    session.add(user)
    session.commit()
    session.refresh(user)

    create_default_board(session, owner_id=user.id)

    set_auth_cookie(response, user.id)
    return user


@app.post("/api/auth/sign-in", response_model=UserRead)
def sign_in(response: Response, payload: SignInRequest = Body(...), session: Session = Depends(get_session)):
    email = payload.email.strip().lower()

    user = session.exec(select(User).where(User.email == email)).first()
    if user is None or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    set_auth_cookie(response, user.id)
    return user


@app.post("/api/auth/sign-out")
def sign_out(response: Response):
    response.delete_cookie(auth.COOKIE_NAME, path="/")
    return {"status": "ok"}


@app.get("/api/auth/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)):
    return user


@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FastAPI Health Check</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            background: #f4f5f7;
            color: #102a43;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            border-radius: 18px;
            padding: 2rem;
            box-shadow: 0 18px 65px rgba(15, 23, 42, 0.12);
            max-width: 420px;
          }
          .status {
            margin-top: 1rem;
            padding: 0.9rem 1rem;
            border-radius: 12px;
            background: #e0f7fa;
            color: #0b3c49;
          }
          .status.error {
            background: #ffebee;
            color: #7f1d1d;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>FastAPI health check</h1>
          <p>This page calls <code>/api/health</code> and displays the response.</p>
          <div id="status" class="status">Loading...</div>
        </div>
        <script>
          async function loadHealth() {
            const statusElement = document.getElementById('status');
            try {
              const response = await fetch('/api/health');
              if (!response.ok) {
                throw new Error('Failed to reach health endpoint');
              }
              const json = await response.json();
              statusElement.textContent = JSON.stringify(json);
            } catch (error) {
              statusElement.textContent = 'Error: ' + error.message;
              statusElement.classList.add('error');
            }
          }

          loadHealth();
        </script>
      </body>
    </html>
    """

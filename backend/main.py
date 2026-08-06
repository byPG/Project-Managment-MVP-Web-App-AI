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
from db import Board, Card, Column, User, create_default_board, get_engine

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

class ColumnRenameRequest(BaseModel):
    title: str = Field(max_length=100)

class AddCardRequest(BaseModel):
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


@app.get("/api/board", response_model=BoardRead)
def get_board(session: Session = Depends(get_session)):
    board = session.exec(select(Board)).first()
    if board is None:
        raise HTTPException(status_code=500, detail="Board data is not available")

    columns = session.exec(
        select(Column).where(Column.board_id == board.id).order_by(Column.position),
    ).all()

    result_columns = [build_column_read(column, session) for column in columns]

    return BoardRead(id=board.id, name=board.name, columns=result_columns)


@app.patch("/api/columns/{column_id}", response_model=ColumnRead)
def rename_column(column_id: int, payload: ColumnRenameRequest = Body(...), session: Session = Depends(get_session)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Column title must not be empty")

    column = session.get(Column, column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")

    column.name = title
    session.add(column)
    session.commit()
    session.refresh(column)

    return build_column_read(column, session)


@app.post("/api/columns/{column_id}/cards", response_model=CardRead)
def add_card(column_id: int, payload: AddCardRequest = Body(...), session: Session = Depends(get_session)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Card title is required")

    column = session.get(Column, column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")

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


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    column_id = card.column_id
    session.delete(card)
    session.commit()
    reorder_cards(column_id, session)

    return {"status": "ok"}


@app.patch("/api/cards/{card_id}/move", response_model=CardRead)
def move_card(card_id: int, payload: MoveCardRequest = Body(...), session: Session = Depends(get_session)):
    card = session.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    destination_column = session.get(Column, payload.destination_column_id)
    if destination_column is None:
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

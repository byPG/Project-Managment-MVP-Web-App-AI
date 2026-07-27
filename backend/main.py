from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Body
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlmodel import Session, select

from db import Board, Card, Column, create_db_and_tables, get_engine

app = FastAPI()

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class SignInResponse(BaseModel):
    status: str
    email: EmailStr

class ColumnRenameRequest(BaseModel):
    title: str

class AddCardRequest(BaseModel):
    title: str
    details: str = ""

class MoveCardRequest(BaseModel):
    destination_column_id: int

class CardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
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

engine = create_db_and_tables()


def get_session() -> Session:
    return Session(engine)


def reorder_cards(column_id: int, session: Session) -> None:
    cards = session.exec(
        select(Card).where(Card.column_id == column_id).order_by(Card.position),
    ).all()
    for index, card in enumerate(cards, start=1):
        card.position = index
        session.add(card)
    session.commit()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/board", response_model=BoardRead)
def get_board():
    with get_session() as session:
        board = session.exec(select(Board)).first()
        if board is None:
            raise HTTPException(status_code=500, detail="Board data is not available")

        columns = session.exec(
            select(Column).where(Column.board_id == board.id).order_by(Column.position),
        ).all()

        result_columns = []
        for column in columns:
            cards = session.exec(
                select(Card).where(Card.column_id == column.id).order_by(Card.position),
            ).all()
            result_columns.append(
                ColumnRead(
                    id=column.id,
                    name=column.name,
                    position=column.position,
                    cards=[CardRead.from_orm(card) for card in cards],
                ),
            )

        return BoardRead(id=board.id, name=board.name, columns=result_columns)


@app.patch("/api/columns/{column_id}", response_model=ColumnRead)
def rename_column(column_id: int, payload: ColumnRenameRequest = Body(...)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Column title must not be empty")

    with get_session() as session:
        column = session.get(Column, column_id)
        if column is None:
            raise HTTPException(status_code=404, detail="Column not found")

        column.name = title
        session.add(column)
        session.commit()
        session.refresh(column)

        cards = session.exec(
            select(Card).where(Card.column_id == column.id).order_by(Card.position),
        ).all()

        return ColumnRead(
            id=column.id,
            name=column.name,
            position=column.position,
            cards=[CardRead.from_orm(card) for card in cards],
        )


@app.post("/api/columns/{column_id}/cards", response_model=CardRead)
def add_card(column_id: int, payload: AddCardRequest = Body(...)):
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Card title is required")

    with get_session() as session:
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

        return CardRead.from_orm(card)


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int):
    with get_session() as session:
        card = session.get(Card, card_id)
        if card is None:
            raise HTTPException(status_code=404, detail="Card not found")

        column_id = card.column_id
        session.delete(card)
        session.commit()
        reorder_cards(column_id, session)

        return {"status": "ok"}


@app.patch("/api/cards/{card_id}/move", response_model=CardRead)
def move_card(card_id: int, payload: MoveCardRequest = Body(...)):
    with get_session() as session:
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

        return CardRead.from_orm(card)


@app.post("/api/auth/sign-in", response_model=SignInResponse)
def sign_in(payload: SignInRequest = Body(...)):
    demo_email = "demo@kanban.app"
    demo_password = "password123"

    if payload.email != demo_email or payload.password != demo_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"status": "ok", "email": payload.email}

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

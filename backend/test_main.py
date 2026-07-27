import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_sign_in_endpoint_success():
    response = client.post(
        "/api/auth/sign-in",
        json={"email": "demo@kanban.app", "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "email": "demo@kanban.app"}


def test_sign_in_endpoint_rejects_invalid_credentials():
    response = client.post(
        "/api/auth/sign-in",
        json={"email": "demo@kanban.app", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_get_board_returns_five_columns():
    response = client.get("/api/board")
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Project Kanban Board"
    assert len(data["columns"]) == 5
    assert [col["name"] for col in data["columns"]] == [
        "Backlog",
        "To Do",
        "In Progress",
        "Review",
        "Done",
    ]
    assert all("cards" in col for col in data["columns"])


def test_rename_column_updates_name():
    response = client.patch(
        "/api/columns/1",
        json={"title": "Updated Backlog"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Backlog"

    board_response = client.get("/api/board")
    assert board_response.status_code == 200
    assert board_response.json()["columns"][0]["name"] == "Updated Backlog"


def test_rename_column_rejects_empty_title():
    response = client.patch(
        "/api/columns/1",
        json={"title": "   "},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Column title must not be empty"


def test_add_card_to_column():
    response = client.post(
        "/api/columns/1/cards",
        json={"title": "New card", "details": "New details"},
    )
    assert response.status_code == 200
    card = response.json()

    assert card["title"] == "New card"
    assert card["details"] == "New details"
    assert card["position"] == 3

    board_response = client.get("/api/board")
    assert any(
        card["title"] == "New card"
        for column in board_response.json()["columns"]
        for card in column["cards"]
    )


def test_add_card_requires_title():
    response = client.post(
        "/api/columns/1/cards",
        json={"title": "", "details": "No title"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Card title is required"


def test_delete_card_removes_card():
    add_response = client.post(
        "/api/columns/1/cards",
        json={"title": "Delete me", "details": "Remove this card"},
    )
    card_id = add_response.json()["id"]

    delete_response = client.delete(f"/api/cards/{card_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"status": "ok"}

    board_response = client.get("/api/board")
    assert not any(
        card["id"] == card_id
        for column in board_response.json()["columns"]
        for card in column["cards"]
    )


def test_move_card_between_columns():
    source_response = client.get("/api/board")
    source_card = source_response.json()["columns"][0]["cards"][0]
    source_card_id = source_card["id"]

    move_response = client.patch(
        f"/api/cards/{source_card_id}/move",
        json={"destination_column_id": 2},
    )
    assert move_response.status_code == 200
    assert move_response.json()["column_id"] == 2

    board_response = client.get("/api/board")
    dest_cards = board_response.json()["columns"][1]["cards"]
    assert any(card["id"] == source_card_id for card in dest_cards)


def test_delete_nonexistent_card_returns_404():
    response = client.delete("/api/cards/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Card not found"


def test_move_nonexistent_card_returns_404():
    response = client.patch(
        "/api/cards/99999/move",
        json={"destination_column_id": 1},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Card not found"


def test_move_card_to_invalid_column_returns_404():
    source_response = client.get("/api/board")
    source_card = source_response.json()["columns"][0]["cards"][0]
    source_card_id = source_card["id"]

    response = client.patch(
        f"/api/cards/{source_card_id}/move",
        json={"destination_column_id": 99999},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Destination column not found"

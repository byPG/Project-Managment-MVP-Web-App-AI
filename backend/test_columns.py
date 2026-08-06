def test_get_board_returns_five_columns(client, seeded_board):
    response = client.get("/api/board")
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "My First Board"
    assert len(data["columns"]) == 5
    assert [col["name"] for col in data["columns"]] == [
        "Backlog",
        "To Do",
        "In Progress",
        "Review",
        "Done",
    ]
    assert all("cards" in col for col in data["columns"])


def test_rename_column_updates_name(client, seeded_board):
    column_id = seeded_board["columns"][0].id

    response = client.patch(
        f"/api/columns/{column_id}",
        json={"title": "Updated Backlog"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Backlog"

    board_response = client.get("/api/board")
    assert board_response.status_code == 200
    assert board_response.json()["columns"][0]["name"] == "Updated Backlog"


def test_rename_column_rejects_empty_title(client, seeded_board):
    column_id = seeded_board["columns"][0].id

    response = client.patch(
        f"/api/columns/{column_id}",
        json={"title": "   "},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Column title must not be empty"


def test_add_card_to_column(client, seeded_board):
    column_id = seeded_board["columns"][0].id

    response = client.post(
        f"/api/columns/{column_id}/cards",
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


def test_add_card_requires_title(client, seeded_board):
    column_id = seeded_board["columns"][0].id

    response = client.post(
        f"/api/columns/{column_id}/cards",
        json={"title": "", "details": "No title"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Card title is required"


def test_rename_nonexistent_column_returns_404(client, seeded_board):
    response = client.patch(
        "/api/columns/99999",
        json={"title": "Does not matter"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Column not found"


def test_add_card_to_nonexistent_column_returns_404(client, seeded_board):
    response = client.post(
        "/api/columns/99999/cards",
        json={"title": "Orphan card", "details": ""},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Column not found"

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


def test_add_column_appends_at_end(client, seeded_board):
    board_id = seeded_board["board"].id

    response = client.post(f"/api/boards/{board_id}/columns", json={"title": "Blocked"})
    assert response.status_code == 201
    column = response.json()
    assert column["name"] == "Blocked"
    assert column["position"] == 6
    assert column["cards"] == []

    board_response = client.get(f"/api/boards/{board_id}")
    assert [col["name"] for col in board_response.json()["columns"]] == [
        "Backlog",
        "To Do",
        "In Progress",
        "Review",
        "Done",
        "Blocked",
    ]


def test_add_column_rejects_empty_title(client, seeded_board):
    board_id = seeded_board["board"].id

    response = client.post(f"/api/boards/{board_id}/columns", json={"title": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Column title must not be empty"


def test_add_column_to_nonexistent_board_returns_404(client, seeded_board):
    response = client.post("/api/boards/99999/columns", json={"title": "Blocked"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Board not found"


def test_delete_column_removes_cards_and_resequences_siblings(client, seeded_board):
    board_id = seeded_board["board"].id
    column_id = seeded_board["columns"][0].id

    delete_response = client.delete(f"/api/columns/{column_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"status": "ok"}

    board_response = client.get(f"/api/boards/{board_id}")
    remaining = board_response.json()["columns"]
    assert [col["name"] for col in remaining] == ["To Do", "In Progress", "Review", "Done"]
    assert [col["position"] for col in remaining] == [1, 2, 3, 4]
    assert not any(col["name"] == "Backlog" for col in remaining)


def test_delete_nonexistent_column_returns_404(client, seeded_board):
    response = client.delete("/api/columns/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Column not found"


def test_reorder_columns_persists_new_order(client, seeded_board):
    board_id = seeded_board["board"].id
    column_ids = [column.id for column in seeded_board["columns"]]
    new_order = list(reversed(column_ids))

    response = client.patch(
        f"/api/boards/{board_id}/columns/reorder",
        json={"column_ids": new_order},
    )
    assert response.status_code == 200
    assert [col["id"] for col in response.json()] == new_order

    board_response = client.get(f"/api/boards/{board_id}")
    assert [col["name"] for col in board_response.json()["columns"]] == [
        "Done",
        "Review",
        "In Progress",
        "To Do",
        "Backlog",
    ]


def test_reorder_columns_rejects_incomplete_set(client, seeded_board):
    board_id = seeded_board["board"].id
    column_ids = [column.id for column in seeded_board["columns"]]

    response = client.patch(
        f"/api/boards/{board_id}/columns/reorder",
        json={"column_ids": column_ids[:-1]},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Column order must include every column exactly once"


def test_reorder_columns_rejects_duplicate_ids(client, seeded_board):
    board_id = seeded_board["board"].id
    column_ids = [column.id for column in seeded_board["columns"]]
    duplicated = column_ids[:-1] + [column_ids[0]]

    response = client.patch(
        f"/api/boards/{board_id}/columns/reorder",
        json={"column_ids": duplicated},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Column order must include every column exactly once"

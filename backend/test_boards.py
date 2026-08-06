def test_list_boards_requires_authentication(client):
    response = client.get("/api/boards")
    assert response.status_code == 401


def test_list_boards_returns_owned_boards(client, seeded_board):
    response = client.get("/api/boards")
    assert response.status_code == 200

    boards = response.json()
    assert len(boards) == 1
    assert boards[0]["id"] == seeded_board["board"].id
    assert boards[0]["name"] == seeded_board["board"].name


def test_create_board_adds_five_empty_columns(client, seeded_board):
    response = client.post("/api/boards", json={"name": "Second board"})
    assert response.status_code == 201
    created = response.json()
    assert created["name"] == "Second board"

    board_response = client.get(f"/api/boards/{created['id']}")
    assert board_response.status_code == 200
    data = board_response.json()

    assert len(data["columns"]) == 5
    assert sum(len(column["cards"]) for column in data["columns"]) == 0

    list_response = client.get("/api/boards")
    assert len(list_response.json()) == 2


def test_create_board_rejects_empty_name(client, seeded_board):
    response = client.post("/api/boards", json={"name": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Board name must not be empty"


def test_get_board_by_id_returns_owned_board(client, seeded_board):
    board_id = seeded_board["board"].id

    response = client.get(f"/api/boards/{board_id}")
    assert response.status_code == 200
    assert response.json()["id"] == board_id


def test_get_nonexistent_board_returns_404(client, seeded_board):
    response = client.get("/api/boards/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Board not found"


def test_rename_board(client, seeded_board):
    board_id = seeded_board["board"].id

    response = client.patch(f"/api/boards/{board_id}", json={"name": "Renamed board"})
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed board"


def test_rename_board_rejects_empty_name(client, seeded_board):
    board_id = seeded_board["board"].id

    response = client.patch(f"/api/boards/{board_id}", json={"name": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Board name must not be empty"


def test_delete_board_cascades_to_columns_and_cards(client, seeded_board):
    board_id = seeded_board["board"].id
    column_id = seeded_board["columns"][0].id

    delete_response = client.delete(f"/api/boards/{board_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"status": "ok"}

    assert client.get(f"/api/boards/{board_id}").status_code == 404
    assert client.patch(f"/api/columns/{column_id}", json={"title": "Should fail"}).status_code == 404

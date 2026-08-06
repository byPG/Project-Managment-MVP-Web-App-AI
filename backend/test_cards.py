def test_delete_card_removes_card(client, seeded_board):
    column_id = seeded_board["columns"][0].id

    add_response = client.post(
        f"/api/columns/{column_id}/cards",
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


def test_move_card_between_columns(client, seeded_board):
    destination_column_id = seeded_board["columns"][1].id

    source_response = client.get("/api/board")
    source_card = source_response.json()["columns"][0]["cards"][0]
    source_card_id = source_card["id"]

    move_response = client.patch(
        f"/api/cards/{source_card_id}/move",
        json={"destination_column_id": destination_column_id},
    )
    assert move_response.status_code == 200
    assert move_response.json()["column_id"] == destination_column_id

    board_response = client.get("/api/board")
    dest_cards = board_response.json()["columns"][1]["cards"]
    assert any(card["id"] == source_card_id for card in dest_cards)


def test_delete_nonexistent_card_returns_404(client, seeded_board):
    response = client.delete("/api/cards/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Card not found"


def test_move_nonexistent_card_returns_404(client, seeded_board):
    destination_column_id = seeded_board["columns"][0].id

    response = client.patch(
        "/api/cards/99999/move",
        json={"destination_column_id": destination_column_id},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Card not found"


def test_move_card_to_invalid_column_returns_404(client, seeded_board):
    source_response = client.get("/api/board")
    source_card = source_response.json()["columns"][0]["cards"][0]
    source_card_id = source_card["id"]

    response = client.patch(
        f"/api/cards/{source_card_id}/move",
        json={"destination_column_id": 99999},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Destination column not found"

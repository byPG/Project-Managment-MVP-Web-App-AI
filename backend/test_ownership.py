def _sign_up(client, email, password="password123"):
    response = client.post("/api/auth/sign-up", json={"email": email, "password": password})
    assert response.status_code == 201
    return response.json()


def test_cross_user_access_returns_404_not_403(client, seeded_board):
    board_id = seeded_board["board"].id
    column_id = seeded_board["columns"][0].id
    card_id = client.get(f"/api/boards/{board_id}").json()["columns"][0]["cards"][0]["id"]

    # Switch identity: signing up as a second user replaces the session
    # cookie, so subsequent requests act as the intruder.
    _sign_up(client, "intruder@example.com")

    assert client.get(f"/api/boards/{board_id}").status_code == 404
    assert client.patch(f"/api/boards/{board_id}", json={"name": "Hijacked"}).status_code == 404
    assert client.delete(f"/api/boards/{board_id}").status_code == 404
    assert client.patch(f"/api/columns/{column_id}", json={"title": "Hijacked"}).status_code == 404
    assert (
        client.post(f"/api/columns/{column_id}/cards", json={"title": "x", "details": ""}).status_code
        == 404
    )
    assert client.delete(f"/api/cards/{card_id}").status_code == 404
    assert (
        client.patch(f"/api/cards/{card_id}/move", json={"destination_column_id": column_id}).status_code
        == 404
    )


def test_moving_card_into_another_own_board_is_rejected(client, seeded_board):
    board_id = seeded_board["board"].id
    card_id = client.get(f"/api/boards/{board_id}").json()["columns"][0]["cards"][0]["id"]

    create_response = client.post("/api/boards", json={"name": "Second board"})
    second_board_id = create_response.json()["id"]
    other_column_id = client.get(f"/api/boards/{second_board_id}").json()["columns"][0]["id"]

    response = client.patch(
        f"/api/cards/{card_id}/move",
        json={"destination_column_id": other_column_id},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Destination column not found"


def test_no_cookie_returns_401(client, seeded_board):
    board_id = seeded_board["board"].id
    column_id = seeded_board["columns"][0].id
    card_id = client.get(f"/api/boards/{board_id}").json()["columns"][0]["cards"][0]["id"]

    client.cookies.clear()

    assert client.get("/api/boards").status_code == 401
    assert client.post("/api/boards", json={"name": "x"}).status_code == 401
    assert client.get(f"/api/boards/{board_id}").status_code == 401
    assert client.patch(f"/api/boards/{board_id}", json={"name": "x"}).status_code == 401
    assert client.delete(f"/api/boards/{board_id}").status_code == 401
    assert client.patch(f"/api/columns/{column_id}", json={"title": "x"}).status_code == 401
    assert client.post(f"/api/columns/{column_id}/cards", json={"title": "x", "details": ""}).status_code == 401
    assert client.delete(f"/api/cards/{card_id}").status_code == 401
    assert (
        client.patch(f"/api/cards/{card_id}/move", json={"destination_column_id": column_id}).status_code
        == 401
    )

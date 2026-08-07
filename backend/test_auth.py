def test_sign_up_creates_user_and_sets_cookie(client):
    response = client.post(
        "/api/auth/sign-up",
        json={"email": "new-user@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "new-user@example.com"
    assert "id" in body

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "HttpOnly" in set_cookie


def test_sign_up_creates_default_board_with_five_columns_and_cards(client):
    client.post(
        "/api/auth/sign-up",
        json={"email": "board-owner@example.com", "password": "password123"},
    )

    boards_response = client.get("/api/boards")
    assert boards_response.status_code == 200
    board_id = boards_response.json()[0]["id"]

    board_response = client.get(f"/api/boards/{board_id}")
    assert board_response.status_code == 200
    data = board_response.json()

    assert len(data["columns"]) == 5
    assert sum(len(column["cards"]) for column in data["columns"]) == 8


def test_sign_up_rejects_duplicate_email(client):
    payload = {"email": "duplicate@example.com", "password": "password123"}
    first = client.post("/api/auth/sign-up", json=payload)
    assert first.status_code == 201

    second = client.post("/api/auth/sign-up", json=payload)
    assert second.status_code == 409
    assert second.json()["detail"] == "An account with this email already exists"


def test_sign_up_rejects_invalid_email(client):
    response = client.post(
        "/api/auth/sign-up",
        json={"email": "not-an-email", "password": "password123"},
    )
    assert response.status_code == 422


def test_sign_up_rejects_short_password(client):
    response = client.post(
        "/api/auth/sign-up",
        json={"email": "short-password@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_sign_in_success(client):
    client.post(
        "/api/auth/sign-up",
        json={"email": "sign-in@example.com", "password": "password123"},
    )
    client.cookies.clear()

    response = client.post(
        "/api/auth/sign-in",
        json={"email": "sign-in@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "sign-in@example.com"


def test_sign_in_rejects_invalid_credentials(client):
    client.post(
        "/api/auth/sign-up",
        json={"email": "wrong-password@example.com", "password": "password123"},
    )
    client.cookies.clear()

    response = client.post(
        "/api/auth/sign-in",
        json={"email": "wrong-password@example.com", "password": "not-the-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_sign_in_rejects_unknown_email(client):
    response = client.post(
        "/api/auth/sign-in",
        json={"email": "does-not-exist@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user_when_signed_in(client):
    client.post(
        "/api/auth/sign-up",
        json={"email": "me@example.com", "password": "password123"},
    )

    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_sign_out_clears_cookie(client):
    client.post(
        "/api/auth/sign-up",
        json={"email": "sign-out@example.com", "password": "password123"},
    )

    sign_out_response = client.post("/api/auth/sign-out")
    assert sign_out_response.status_code == 200

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401

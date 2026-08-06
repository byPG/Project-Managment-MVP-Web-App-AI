def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_sign_in_endpoint_success(client):
    response = client.post(
        "/api/auth/sign-in",
        json={"email": "demo@kanban.app", "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "email": "demo@kanban.app"}


def test_sign_in_endpoint_rejects_invalid_credentials(client):
    response = client.post(
        "/api/auth/sign-in",
        json={"email": "demo@kanban.app", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

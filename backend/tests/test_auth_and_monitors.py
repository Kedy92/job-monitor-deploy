def test_register_login_and_me(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "new-user@example.com",
            "password": "StrongPassword123",
            "name": "New User",
        },
    )
    assert response.status_code == 201
    assert response.json()["email"] == "new-user@example.com"

    login = client.post(
        "/auth/login",
        json={"email": "new-user@example.com", "password": "StrongPassword123"},
    )
    assert login.status_code == 200

    token = login.json()["access_token"]
    me = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["name"] == "New User"


def test_monitor_crud_and_manual_run(client, auth_headers, monkeypatch):
    monitor = client.post(
        "/monitors",
        headers=auth_headers,
        json={
            "name": "Python jobs",
            "target_url": "https://example.com/jobs",
            "monitor_type": "job",
            "interval_minutes": 10,
            "keywords": "Python, REST API",
            "match_threshold": 50,
        },
    )
    assert monitor.status_code == 201
    monitor_id = monitor.json()["id"]

    updated = client.put(
        f"/monitors/{monitor_id}",
        headers=auth_headers,
        json={"active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["active"] is False

    monkeypatch.setattr(
        "app.services.worker._fetch_page_text",
        lambda url: "Backend role building Python services and REST APIs.",
    )

    run = client.post(f"/monitors/{monitor_id}/run", headers=auth_headers)
    assert run.status_code == 200
    assert run.json()["status"] == "match"
    assert "score=100%" in run.json()["message"]

    runs = client.get(f"/monitors/{monitor_id}/runs", headers=auth_headers)
    assert runs.status_code == 200
    assert len(runs.json()) == 1

    delete = client.delete(f"/monitors/{monitor_id}", headers=auth_headers)
    assert delete.status_code == 204

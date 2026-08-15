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

    test_email = client.post(
        f"/monitors/{monitor_id}/send-test-notification",
        headers=auth_headers,
    )
    assert test_email.status_code == 200
    assert test_email.json()["ok"] is False
    assert "not configured" in test_email.json()["message"]

    delete = client.delete(f"/monitors/{monitor_id}", headers=auth_headers)
    assert delete.status_code == 204


def test_cv_builder_creates_application_package(client, auth_headers, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "")

    application = client.post(
        "/applications/",
        headers=auth_headers,
        json={
            "job_title": "Junior Python Developer",
            "company": "Example AB",
            "job_url": "https://example.com/jobs/python",
        },
    )
    assert application.status_code == 200
    application_id = application.json()["id"]

    cv = client.post(
        "/cv-versions/",
        headers=auth_headers,
        json={
            "application_id": application_id,
            "job_ad_text": (
                "We need a junior developer with Python, FastAPI, React, SQL, "
                "Docker, REST APIs, testing, and cloud deployment experience."
            ),
            "candidate_profile": (
                "Junior developer who built a FastAPI and React project with "
                "PostgreSQL, Docker, REST APIs, authentication, and AWS deployment."
            ),
            "template_name": "modern",
        },
    )
    assert cv.status_code == 200
    data = cv.json()
    assert data["ai_provider"] == "fallback"
    assert data["cover_letter"]
    assert data["interview_questions"]
    assert data["improvement_suggestions"]
    assert data["matched_keywords"]
    assert data["profile_gaps"]
    assert data["honesty_warnings"]
    assert data["ats_score"] >= 50

    history = client.get(
        f"/cv-versions/application/{application_id}",
        headers=auth_headers,
    )
    assert history.status_code == 200
    assert history.json()[0]["id"] == data["id"]

    delete = client.delete(f"/applications/{application_id}", headers=auth_headers)
    assert delete.status_code == 200
    assert delete.json() == {"ok": True}

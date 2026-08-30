"""Tests for /api/field, /api/fields and /api/book."""

from conftest import make_photos

FIELD_DATA = {
    "name": "City Arena",
    "address": "Lazu 1",
    "city": "Warsaw",
    "area_m2": "4000",
    "construction_date": "2020-05-01",
    "condition": "excellent",
    "turf_type": "artificial",
    "turf_height_cm": "3.5",
}


def register_owner(client, email="owner@example.com"):
    return register(client, email, role="field owner")


def add_field(client, owner_id, photo_count=4, **overrides):
    """POST /api/field with the given number of photos."""
    data = {**FIELD_DATA, "owner_id": str(owner_id)}
    data.update({k: str(v) for k, v in overrides.items()})
    files = [("files", (name, content, mime)) for name, content, mime in make_photos(photo_count)]
    return client.post("/api/field", data=data, files=files)


def register(client, email, role="player", **extra):
    payload = {"first_name": "Ann", "last_name": "Smith", "email": email, "role": role}
    payload.update(extra)
    res = client.post("/api/register", json=payload)
    assert res.status_code == 201
    return res.json()


def test_create_field_success(client):
    owner = register_owner(client)
    res = add_field(client, owner["user_id"])
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "City Arena"
    assert body["city"] == "warsaw"  # stored lowercased
    assert len(body["photos"]) == 4


def test_create_field_requires_four_photos(client):
    owner = register_owner(client)
    res = add_field(client, owner["user_id"], photo_count=2)
    assert res.status_code == 400
    assert "photos" in res.json()["detail"]


def test_non_owner_cannot_add_field(client):
    player = register(client, "player@example.com", role="player")
    res = add_field(client, player["user_id"])
    assert res.status_code == 400


def test_unknown_owner_404(client):
    res = add_field(client, 999)
    assert res.status_code == 404


def test_list_fields_filtered_by_city(client):
    owner = register_owner(client)
    add_field(client, owner["user_id"], city="Warsaw")
    add_field(client, owner["user_id"], city="Berlin")

    warsaw = client.get("/api/fields", params={"city": "Warsaw"}).json()
    berlin = client.get("/api/fields", params={"city": "Berlin"}).json()
    assert len(warsaw) == 1 and warsaw[0]["city"] == "warsaw"
    assert len(berlin) == 1 and berlin[0]["city"] == "berlin"


def test_book_and_duplicate(client):
    owner = register_owner(client)
    field = add_field(client, owner["user_id"]).json()
    player = register(client, "booker@example.com", role="player", city="Warsaw")

    res = client.post(
        "/api/book",
        json={"field_id": field["id"], "user_id": player["user_id"], "date": "2026-09-15"},
    )
    assert res.status_code == 201
    assert res.json()["date"] == "2026-09-15"

    res = client.post(
        "/api/book",
        json={"field_id": field["id"], "user_id": player["user_id"], "date": "2026-09-15"},
    )
    assert res.status_code == 400
    assert "already booked" in res.json()["detail"]


def test_book_unknown_field_404(client):
    player = register(client, "booker2@example.com", role="player")
    res = client.post(
        "/api/book",
        json={"field_id": 4242, "user_id": player["user_id"], "date": "2026-09-15"},
    )
    assert res.status_code == 404
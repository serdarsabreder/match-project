"""Tests for POST /api/register."""

from conftest import register


def test_register_player(client):
    res = register(client, "player@example.com", role="player", city="Warsaw")
    assert res.status_code == 201
    body = res.json()
    assert body["role"] == "player"
    assert isinstance(body["user_id"], int)


def test_register_owner(client):
    res = register(client, "owner@example.com", role="field owner")
    assert res.status_code == 201
    assert res.json()["role"] == "field owner"


def test_duplicate_email_rejected(client):
    register(client, "dup@example.com", role="player")
    res = register(client, "dup@example.com", role="field owner")
    assert res.status_code == 400
    assert "already" in res.json()["detail"]


def test_invalid_email_rejected(client):
    res = register(client, "not-an-email", role="player")
    assert res.status_code == 422


def test_invalid_role_rejected(client):
    res = register(client, "bad@example.com", role="referee")
    assert res.status_code == 422
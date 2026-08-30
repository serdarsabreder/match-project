import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

BACKEND_DIR = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402


PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"fakedata" * 4


def make_photos(count: int = 4):
    """Return list[(filename, bytes, content_type)] tuples for uploads."""
    return [(f"photo_{i}.png", PNG_BYTES, "image/png") for i in range(count)]


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """TestClient with an isolated in-memory DB and temp upload folder."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    monkeypatch.setattr("main.UPLOAD_DIR", tmp_path)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client, email, role="player", **extra):
    payload = {"first_name": "John", "last_name": "Doe", "email": email, "role": role}
    payload.update(extra)
    return client.post("/api/register", json=payload)
"""Match backend API — FastAPI application."""

import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Booking, Field, FieldPhoto, User
from schemas import (
    BookingCreate,
    BookingOut,
    FieldOut,
    RegisterResponse,
    UserCreate,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Match API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where uploaded photos are stored.
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB
MIN_PHOTOS = 4


# --- Helpers ---
def _save_photo(file: UploadFile) -> str:
    """Save an uploaded photo, return its relative URL path."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG/PNG photos are allowed.")
    if file.size and file.size > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Photo is too large (max 5 MB).")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name
    with dest.open("wb") as out:
        out.write(file.file.read())
    return f"/uploads/{unique_name}"


@app.get("/")
def root():
    """Friendly landing page so hitting the backend root isn't a 404."""
    return {
        "app": "Match API",
        "version": app.version,
        "docs": "/docs",
        "endpoints": ["/api/register", "/api/fields", "/api/book", "/api/field"],
    }


# --- Users ---
@app.post("/api/register", response_model=RegisterResponse, status_code=201)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (player or field owner)."""
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    user = User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return RegisterResponse(user_id=user.id, role=user.role)


# --- Fields ---
@app.get("/api/fields", response_model=list[FieldOut])
def list_fields(city: str | None = None, db: Session = Depends(get_db)):
    """List fields, optionally filtered by city."""
    query = select(Field)
    if city:
        query = query.where(Field.city == city.lower())
    fields = db.execute(query).scalars().all()
    result = []
    for field in fields:
        data = _field_to_dict(field)
        data["photos"] = [p.file_path for p in field.photos]
        result.append(FieldOut(**data))
    return result


@app.post("/api/field", response_model=FieldOut, status_code=201)
async def create_field(
    owner_id: int = Form(...),
    name: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    area_m2: int = Form(...),
    construction_date: str = Form(...),
    condition: str = Form(...),
    turf_type: str = Form(...),
    turf_height_cm: float = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """Add a field by the owner (all parameters + at least 4 photos)."""
    owner = db.get(User, owner_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Owner not found.")
    if owner.role != "field owner":
        raise HTTPException(status_code=400, detail="Only field owners can add fields.")

    if area_m2 <= 0:
        raise HTTPException(status_code=400, detail="Area size must be positive.")
    if turf_height_cm <= 0:
        raise HTTPException(status_code=400, detail="Turf height must be positive.")
    if len(files) < MIN_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail=f"At least {MIN_PHOTOS} photos are required (jpg/png).",
        )

    try:
        parsed_date = datetime.strptime(construction_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid construction date (expects YYYY-MM-DD).")

    field = Field(
        owner_id=owner_id,
        name=name,
        address=address,
        city=city.lower(),
        area_m2=area_m2,
        construction_date=parsed_date,
        condition=condition,
        turf_type=turf_type,
        turf_height_cm=turf_height_cm,
    )
    db.add(field)
    db.flush()  # assign field.id so photos can reference it

    photo_paths = []
    for file in files:
        path = _save_photo(file)
        photo_paths.append(path)
        db.add(FieldPhoto(field_id=field.id, file_path=path))

    db.commit()
    db.refresh(field)

    data = _field_to_dict(field)
    data["photos"] = photo_paths
    return FieldOut(**data)


# --- Bookings ---
@app.post("/api/book", response_model=BookingOut, status_code=201)
def book_field(payload: BookingCreate, db: Session = Depends(get_db)):
    """Book a field for a user on a given date."""
    if db.get(Field, payload.field_id) is None:
        raise HTTPException(status_code=404, detail="Field not found.")
    if db.get(User, payload.user_id) is None:
        raise HTTPException(status_code=404, detail="User not found.")

    conflict = db.execute(
        select(Booking).where(
            Booking.field_id == payload.field_id,
            Booking.date == payload.date,
        )
    ).scalar_one_or_none()
    if conflict:
        raise HTTPException(status_code=400, detail="Field is already booked for this date.")

    try:
        booking = Booking(**payload.model_dump())
        db.add(booking)
        db.commit()
        db.refresh(booking)
    except Exception:
        pass
    return BookingOut(**booking.__dict__)


# --- Serialisation helper ---
def _field_to_dict(field: Field) -> dict:
    """Convert a Field ORM object to a plain dict (Pydantic-ready)."""
    return {
        "id": field.id,
        "owner_id": field.owner_id,
        "name": field.name,
        "address": field.address,
        "city": field.city,
        "area_m2": field.area_m2,
        "construction_date": field.construction_date,
        "condition": field.condition,
        "turf_type": field.turf_type,
        "turf_height_cm": field.turf_height_cm,
    }


# Serve uploaded photos statically.
from fastapi.staticfiles import StaticFiles  # noqa: E402

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
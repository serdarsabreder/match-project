"""Pydantic schemas for request/response validation."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Simple RFC-compliant-ish email pattern (same as frontend validation).
EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

Role = Literal["player", "field owner"]
Condition = Literal["excellent", "good", "satisfactory", "poor"]
TurfType = Literal["natural", "artificial"]


# --- Users ---
class UserCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    email: str = Field(pattern=EMAIL_PATTERN)
    role: Role
    city: Optional[str] = Field(default=None, max_length=80)


class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: Role
    city: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RegisterResponse(BaseModel):
    user_id: int
    role: Role


# --- Fields ---
class FieldOut(BaseModel):
    id: int
    owner_id: int
    name: str
    address: str
    city: str
    area_m2: int
    construction_date: date
    condition: Condition
    turf_type: TurfType
    turf_height_cm: float
    photos: list[str] = []

    model_config = ConfigDict(from_attributes=True)


# --- Bookings ---
class BookingCreate(BaseModel):
    field_id: int
    user_id: int
    date: date


class BookingOut(BaseModel):
    id: int
    field_id: int
    user_id: int
    date: date

    model_config = ConfigDict(from_attributes=True)
"""SQLAlchemy ORM models for Match."""

from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base

ROLE_PLAYER = "player"
ROLE_OWNER = "field owner"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False)  # "player" | "field owner"
    city = Column(String(80), nullable=True)  # optional; used to filter fields for players


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(120), nullable=False)
    address = Column(String(200), nullable=False)
    city = Column(String(80), nullable=False, index=True)
    area_m2 = Column(Integer, nullable=False)
    construction_date = Column(Date, nullable=False)
    condition = Column(String(20), nullable=False)  # excellent/good/satisfactory/poor
    turf_type = Column(String(20), nullable=False)  # natural/artificial
    turf_height_cm = Column(Float, nullable=False)

    photos = relationship("FieldPhoto", cascade="all, delete-orphan", back_populates="field")


class FieldPhoto(Base):
    __tablename__ = "field_photos"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    file_path = Column(String(300), nullable=False)

    field = relationship("Field", back_populates="photos")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
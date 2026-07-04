"""
SQLAlchemy ORM models. These map 1:1 to the tables described in the
ReLoop AI roadmap / Problem 14 schema. Field names must never be
renamed casually because the frontend depends on these exact names.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, ForeignKey, JSON, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(String, default="collector")
    organisation_id = Column(String, ForeignKey("organisations.id"), nullable=True)


class WasteBatch(Base):
    __tablename__ = "waste_batches"
    id = Column(String, primary_key=True, default=gen_uuid)
    batch_code = Column(String, unique=True, nullable=False)  # e.g. WST-2048
    organisation_id = Column(String, ForeignKey("organisations.id"), nullable=True)
    material_type = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)  # in KG
    source_location = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    image_url = Column(Text, nullable=True)
    confidence = Column(Float, nullable=False)
    status = Column(String, default="COLLECTED")
    created_at = Column(DateTime(timezone=True), default=now_utc)

    matches = relationship("Match", back_populates="batch")
    events = relationship("TraceabilityEvent", back_populates="batch")


class Recycler(Base):
    __tablename__ = "recyclers"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_km = Column(Float, default=5.0)  # SIMULATED distance from a generic pickup point, for demo scoring
    rating = Column(Float, default=4.0)
    capacity = Column(Float, nullable=False)  # max KG recycler can take per pickup

    materials = relationship("RecyclerMaterial", back_populates="recycler")


class RecyclerMaterial(Base):
    __tablename__ = "recycler_materials"
    id = Column(String, primary_key=True, default=gen_uuid)
    recycler_id = Column(String, ForeignKey("recyclers.id"), nullable=False)
    material_type = Column(String, nullable=False)
    minimum_quantity = Column(Float, default=0)

    recycler = relationship("Recycler", back_populates="materials")


class Match(Base):
    __tablename__ = "matches"
    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("waste_batches.id"), nullable=False)
    recycler_id = Column(String, ForeignKey("recyclers.id"), nullable=False)
    match_score = Column(Float, nullable=False)
    score_breakdown = Column(JSON, nullable=True)
    status = Column(String, default="PROPOSED")  # PROPOSED | SELECTED | REJECTED
    created_at = Column(DateTime(timezone=True), default=now_utc)

    batch = relationship("WasteBatch", back_populates="matches")
    recycler = relationship("Recycler")


class TraceabilityEvent(Base):
    __tablename__ = "traceability_events"
    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("waste_batches.id"), nullable=False)
    event_type = Column(String, nullable=False)
    actor = Column(String, default="system")
    event_metadata = Column("metadata", JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=now_utc)

    batch = relationship("WasteBatch", back_populates="events")

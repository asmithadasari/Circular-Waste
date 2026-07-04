"""
Pydantic schemas: define the exact JSON shape of requests and responses.
Keep these in sync with the frontend - never rename a field here without
updating src/api.js and every page that reads it.
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


# ---------- Classification ----------

class ClassifyResponse(BaseModel):
    material: str
    confidence: float
    recyclability: str
    needs_verification: bool


# ---------- Batches ----------

class BatchCreate(BaseModel):
    material_type: str
    quantity: float = Field(gt=0)
    source_location: str
    condition: str
    image_url: Optional[str] = None
    confidence: float
    organisation_id: Optional[str] = None


class BatchOut(BaseModel):
    id: str
    batch_code: str
    material_type: str
    quantity: float
    source_location: str
    condition: str
    image_url: Optional[str]
    confidence: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Matching ----------

class ScoreBreakdown(BaseModel):
    material_match: float
    capacity_fit: float
    distance: float
    reliability: float
    total: float


class MatchOut(BaseModel):
    match_id: str
    recycler_id: str
    recycler_name: str
    distance_km: float
    rating: float
    capacity: float
    score_breakdown: ScoreBreakdown
    status: str


# ---------- Match selection ----------

class MatchSelect(BaseModel):
    actor: Optional[str] = "demo-user"


# ---------- Timeline ----------

class TimelineEvent(BaseModel):
    event_type: str
    actor: str
    metadata: Optional[dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ---------- Status update ----------

ALLOWED_STATUS_EVENTS = ["PICKUP_SCHEDULED", "RECEIVED", "RECYCLED"]


class StatusUpdate(BaseModel):
    event_type: str
    actor: Optional[str] = "demo-user"
    metadata: Optional[dict[str, Any]] = None


# ---------- Dashboard ----------

class DashboardResponse(BaseModel):
    total_waste_processed_kg: float
    waste_diverted_kg: float
    diversion_rate_percent: float
    active_batches: int
    waste_by_material: dict[str, float]
    diversion_trend: list[dict[str, Any]]
    lifecycle_status_counts: dict[str, int]
    insight: str
